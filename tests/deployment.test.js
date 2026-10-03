'use strict';
// Deployment checks: imported function, durable login, and libSQL adapter.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hostel-deploy-'));
Object.assign(process.env, {
  NODE_ENV:'test', VERCEL:'', TURSO_DATABASE_URL:'', TURSO_AUTH_TOKEN:'',
  DB_PATH:path.join(temp,'main.db'), UPLOAD_DIR:path.join(temp,'uploads'),
  ADMIN_EMAIL:'admin@hostel.test', ADMIN_PASSWORD:'admin123', JWT_SECRET:'deployment-test-secret',
});
const app = require('../api');
const { db } = require('../src/db');

async function call(base,method,route,body,token) {
  const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
}

test('Vercel import initializes the database and persisted accounts still log in',async()=>{
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  try {
    const first=await Promise.all(Array.from({length:4},()=>call(base,'GET','/health')));
    assert.ok(first.every(r=>r.status===200));
    const admin=await call(base,'POST','/auth/login',{email:'admin@hostel.test',password:'admin123'});
    assert.equal(admin.status,200);
    const hostel=await call(base,'POST','/hostels',{hostel_name:'Deployment hostel'},admin.data.token);
    assert.equal(hostel.status,201);
    const student=await call(base,'POST','/auth/register',{name:'Student',email:'student@deploy.test',password:'student123',roll_no:'DEP1',hostel_id:hostel.data.hostel_id});
    assert.equal(student.status,201);
    assert.equal((await call(base,'GET','/users/me',undefined,student.data.token)).status,200);
    const fresh=spawnSync(process.execPath,['--disable-warning=ExperimentalWarning','-e',`
      const app=require('./api');const server=app.listen(0,'127.0.0.1',async()=>{
        try {const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/auth/login',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email:'student@deploy.test',password:'student123'})});
          if(res.status!==200 || !(await res.json()).token) process.exitCode=1;
        } catch(err) { console.error(err);process.exitCode=1; }
        finally {server.close();require('./src/db').db.close();}
      });
    `],{cwd:path.join(__dirname,'..'),env:process.env,encoding:'utf8',timeout:15000});
    assert.equal(fresh.status,0,fresh.stderr);
  } finally {await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(temp,{recursive:true,force:true});}
});

test('the libSQL adapter commits and rolls back using the actual SDK',async()=>{
  const {createClient}=require('@libsql/client');
  const client=createClient({url:'file:'+path.join(os.tmpdir(),`hostel-libsql-${process.pid}-${Date.now()}.db`)});
  const remote=require('../src/db/adapter').createDatabase({client});
  try {
    await remote.exec('CREATE TABLE sample (id INTEGER PRIMARY KEY, name TEXT)');
    const result=await remote.transaction(()=>remote.prepare('INSERT INTO sample (name) VALUES (?)').run('kept'));
    assert.equal(Number(result.lastInsertRowid),1);
    await assert.rejects(remote.transaction(async()=>{await remote.prepare('INSERT INTO sample (name) VALUES (?)').run('lost');throw Error('rollback');}),/rollback/);
    assert.deepEqual((await remote.prepare('SELECT name FROM sample').all()).map(r=>r.name),['kept']);
  } finally {remote.close();}
});

test('Vercel refuses a local database and placeholder secrets',()=>{
  const result=spawnSync(process.execPath,['-e',"require('./src/config/env')"],{cwd:path.join(__dirname,'..'),env:{...process.env,VERCEL:'1',JWT_SECRET:'change-me-to-a-long-random-secret'},encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/TURSO_DATABASE_URL/);
  assert.match(result.stderr,/JWT_SECRET/);
});
