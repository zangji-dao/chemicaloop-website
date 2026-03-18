# 后端诊断报告

生成时间: Wed Mar 18 08:16:47 PM CST 2026

## 1. PM2 状态

```
┌────┬─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                    │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 1  │ chemicaloop-backend     │ default     │ N/A     │ fork    │ 0        │ 0      │ 16   │ errored   │ 0%       │ 0b       │ root     │ disabled │
│ 2  │ chemicaloop-frontend    │ default     │ N/A     │ fork    │ 687274   │ 0s     │ 250  │ online    │ 0%       │ 103.1mb  │ root     │ disabled │
│ 0  │ pi-cube                 │ default     │ N/A     │ fork    │ 584421   │ 5h     │ 1    │ online    │ 0%       │ 10.1mb   │ root     │ disabled │
│ 3  │ pi-cube-api             │ default     │ N/A     │ fork    │ 0        │ 0      │ 15   │ errored   │ 0%       │ 0b       │ root     │ disabled │
└────┴─────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## 2. 后端日志 (最近 100 行)

```
[TAILING] Tailing last 100 lines for [chemicaloop-backend] process (change the value with --lines option)
/root/.pm2/logs/chemicaloop-backend-error.log last 100 lines:
1|chemical |   ^
1|chemical | 
1|chemical | Error: Cannot find module '/var/www/chemicaloop-website/backend/dist/index.js'
1|chemical |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
1|chemical |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
1|chemical |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
1|chemical |     at Module._load (node:internal/modules/cjs/loader:1242:25)
1|chemical |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
1|chemical |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
1|chemical |     at node:internal/main/run_main_module:33:47 {
1|chemical |   code: 'MODULE_NOT_FOUND',
1|chemical |   requireStack: []
1|chemical | }
1|chemical | 
1|chemical | Node.js v24.14.0
1|chemical | node:internal/modules/cjs/loader:1459
1|chemical |   throw err;
1|chemical |   ^
1|chemical | 
1|chemical | Error: Cannot find module '/var/www/chemicaloop-website/backend/dist/index.js'
1|chemical |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
1|chemical |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
1|chemical |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
1|chemical |     at Module._load (node:internal/modules/cjs/loader:1242:25)
1|chemical |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
1|chemical |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
1|chemical |     at node:internal/main/run_main_module:33:47 {
1|chemical |   code: 'MODULE_NOT_FOUND',
1|chemical |   requireStack: []
1|chemical | }
1|chemical | 
1|chemical | Node.js v24.14.0
1|chemical | node:internal/modules/cjs/loader:1459
1|chemical |   throw err;
1|chemical |   ^
1|chemical | 
1|chemical | Error: Cannot find module '/var/www/chemicaloop-website/backend/dist/index.js'
1|chemical |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
1|chemical |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
1|chemical |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
1|chemical |     at Module._load (node:internal/modules/cjs/loader:1242:25)
1|chemical |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
1|chemical |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
1|chemical |     at node:internal/main/run_main_module:33:47 {
1|chemical |   code: 'MODULE_NOT_FOUND',
1|chemical |   requireStack: []
1|chemical | }
1|chemical | 
1|chemical | Node.js v24.14.0
1|chemical | node:internal/modules/cjs/loader:1459
1|chemical |   throw err;
1|chemical |   ^
1|chemical | 
1|chemical | Error: Cannot find module '/var/www/chemicaloop-website/backend/dist/index.js'
1|chemical |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
1|chemical |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
1|chemical |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
1|chemical |     at Module._load (node:internal/modules/cjs/loader:1242:25)
1|chemical |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
1|chemical |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
1|chemical |     at node:internal/main/run_main_module:33:47 {
1|chemical |   code: 'MODULE_NOT_FOUND',
1|chemical |   requireStack: []
1|chemical | }
1|chemical | 
1|chemical | Node.js v24.14.0
1|chemical | node:internal/modules/cjs/loader:1459
1|chemical |   throw err;
1|chemical |   ^
1|chemical | 
1|chemical | Error: Cannot find module '/var/www/chemicaloop-website/backend/dist/index.js'
1|chemical |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
1|chemical |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
1|chemical |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
1|chemical |     at Module._load (node:internal/modules/cjs/loader:1242:25)
1|chemical |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
1|chemical |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
1|chemical |     at node:internal/main/run_main_module:33:47 {
1|chemical |   code: 'MODULE_NOT_FOUND',
1|chemical |   requireStack: []
1|chemical | }
1|chemical | 
1|chemical | Node.js v24.14.0
1|chemical | node:internal/modules/cjs/loader:1459
1|chemical |   throw err;
1|chemical |   ^
1|chemical | 
1|chemical | Error: Cannot find module '/var/www/chemicaloop-website/backend/dist/index.js'
1|chemical |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
1|chemical |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
1|chemical |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
1|chemical |     at Module._load (node:internal/modules/cjs/loader:1242:25)
1|chemical |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
1|chemical |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
1|chemical |     at node:internal/main/run_main_module:33:47 {
1|chemical |   code: 'MODULE_NOT_FOUND',
1|chemical |   requireStack: []
1|chemical | }
1|chemical | 
1|chemical | Node.js v24.14.0

/root/.pm2/logs/chemicaloop-backend-out.log last 100 lines:
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
1|chemical | 
1|chemical | > backend@1.0.0 start /var/www/chemicaloop-website/backend
1|chemical | > node dist/index.js
1|chemical | 
1|chemical |  ELIFECYCLE  Command failed with exit code 1.
```

## 3. 后端健康检查

```
连接失败
```

## 4. 后端环境变量检查

```

```

## 5. 后端进程详情

```
 Describing process with id 1 - name chemicaloop-backend 
┌───────────────────┬───────────────────────────────────────────────┐
│ status            │ errored                                       │
│ name              │ chemicaloop-backend                           │
│ namespace         │ default                                       │
│ version           │ N/A                                           │
│ restarts          │ 16                                            │
│ uptime            │ 0                                             │
│ script path       │ /usr/bin/pnpm                                 │
│ script args       │ run start                                     │
│ error log path    │ /root/.pm2/logs/chemicaloop-backend-error.log │
│ out log path      │ /root/.pm2/logs/chemicaloop-backend-out.log   │
│ pid path          │ /root/.pm2/pids/chemicaloop-backend-1.pid     │
│ interpreter       │ /usr/bin/node                                 │
│ interpreter args  │ N/A                                           │
│ script id         │ 1                                             │
│ exec cwd          │ /var/www/chemicaloop-website/backend          │
│ exec mode         │ fork_mode                                     │
│ node.js version   │ 24.14.0                                       │
│ node env          │ N/A                                           │
│ watch & reload    │ ✘                                             │
│ unstable restarts │ 0                                             │
│ created at        │ N/A                                           │
└───────────────────┴───────────────────────────────────────────────┘
 Divergent env variables from local env 
┌────────┬──────────────────────────────────────┐
│ OLDPWD │ /var/www/chemicaloop-website         │
│ PWD    │ /var/www/chemicaloop-website/backend │
└────────┴──────────────────────────────────────┘

 Add your own code metrics: http://bit.ly/code-metrics
 Use `pm2 logs chemicaloop-backend [--lines 1000]` to display logs
 Use `pm2 env 1` to display environment variables
 Use `pm2 monit` to monitor CPU and Memory usage chemicaloop-backend
```

## 6. 端口占用

```
tcp   LISTEN 0      511                *:5000            *:*          
```

## 7. 后端目录结构

```
total 160
drwxr-xr-x  4 root root  4096 Mar 18 19:55 .
drwxr-xr-x 11 root root  4096 Mar 18 20:09 ..
-rw-r--r--  1 root root   257 Mar 18 19:55 .env.example
-rw-r--r--  1 root root    39 Mar 18 19:55 .gitignore
-rw-r--r--  1 root root   974 Mar 18 19:55 package.json
-rw-r--r--  1 root root 67653 Mar 18 19:55 package-lock.json
-rw-r--r--  1 root root 54868 Mar 18 19:55 pnpm-lock.yaml
-rw-r--r--  1 root root  3960 Mar 18 19:55 README.md
drwxr-xr-x  2 root root  4096 Mar 18 19:55 scripts
drwxr-xr-x  6 root root  4096 Mar 18 19:55 src
-rw-r--r--  1 root root   443 Mar 18 19:55 tsconfig.json
```

## 8. 后端 package.json

```
{
  "name": "backend",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^17.2.4",
    "express": "^5.2.1",
    "express-session": "^1.19.0",
    "jsonwebtoken": "^9.0.3",
    "nodemailer": "^8.0.1",
    "passport": "^0.7.0",
    "passport-facebook": "^3.0.0",
    "passport-google-oauth20": "^2.0.0",
    "pg": "^8.18.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/express-session": "^1.18.2",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^25.2.1",
    "@types/nodemailer": "^7.0.9",
    "@types/passport": "^1.0.17",
    "@types/passport-facebook": "^3.0.4",
    "@types/passport-google-oauth20": "^2.0.17",
    "nodemon": "^3.1.11",
    "ts-node": "^10.9.2",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

---
报告结束
