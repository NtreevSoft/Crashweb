/*
 * Crashweb
 * https://github.com/NtreevSoft/Crashweb
 * 
 * Released under the MIT License.
 * 
 * Copyright (c) 2008 Ntreev Soft co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
 * persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the 
 * Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */ 

-----------------------------------------------------------------------------------------------------------------------
-- 로그인 계정, 스키마, 실행 권한

USE [CRASHWEB_DB]
GO

CREATE LOGIN [CrashwebUser] WITH PASSWORD=N'xxxx', DEFAULT_DATABASE=[CRASHWEB_DB], DEFAULT_LANGUAGE=[한국어], CHECK_EXPIRATION=OFF, CHECK_POLICY=ON
GO
CREATE USER [CrashwebUser] FOR LOGIN [CrashwebUser] WITH DEFAULT_SCHEMA=[CrashwebUser]
GO

CREATE SCHEMA [CrashwebUser] AUTHORIZATION [CrashwebUser]
GO
GRANT EXECUTE TO [CrashwebUser]
GO

-----------------------------------------------------------------------------------------------------------------------
-- 프로젝트 만들기

USE [CRASHWEB_DB]
GO

-- 만들기
INSERT INTO dbo.tbl_project
VALUES ('your project name');


-- project_uid 확인하기
SELECT *
FROM dbo.tbl_project;


