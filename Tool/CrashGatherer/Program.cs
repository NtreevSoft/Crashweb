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

using System;
using System.Collections.Generic;
using System.Text;
using ICSharpCode.SharpZipLib; // allowed to use commercially
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Globalization;

namespace CrashGatherer
{
    class Program
    {
        static string CDBPath = @"CDB.EXE";
        static bool kBase64Nickname = false;

        public struct sCallstack
        {
            public int depth;
            public string funcname;
            public string fileline;
        }

        public struct sReportInfo
        {
            public int acnt_uid;
            public string login_id;
            public int user_uid;
            public string nickname;
            public string version;
            public string ipaddr;
            public string date;

            public string uservoice;

            public byte[] signatrue;
            public List<sCallstack> callstack;

            public void ResetReportInfo()
            {
                acnt_uid = 0;
                login_id = "";
                user_uid = 0;
                nickname = "";
                version = "";
                ipaddr = "";
                date = "";

                uservoice = "";
                signatrue = null;

                if (callstack !=  null)
                    callstack.Clear();
            }
        };

        static bool IsCDBExists()
        {
            try
            {
                System.Diagnostics.Process cdb = new System.Diagnostics.Process();
                cdb.StartInfo.UseShellExecute = false;
                cdb.StartInfo.FileName = CDBPath;
                cdb.StartInfo.RedirectStandardOutput = true;
                if (cdb.Start() == false)
                {
                    Console.WriteLine("Start CDB.EXE failed: Path={0}", CDBPath);
                    return false;
                }

                cdb.StandardOutput.ReadToEnd();
                cdb.WaitForExit();
            }
            catch (System.Exception e)
            {
                Console.WriteLine("IsCDBExists() fail: Path={0}", e.Message);
                return false;
            }

            return true;
        }

        static bool ExtractFromFilename(string filename, out string ipaddr, out string datetime)
        {
            ipaddr = "";
            datetime = "";

            string nameOnly = filename;
            int pos = filename.LastIndexOf('\\');
            if (pos != -1)
            {
                nameOnly = filename.Substring(pos+1);
            }

            if (nameOnly.EndsWith(".zip") == false)
            {
                return false;
            }

            string[] items = nameOnly.Split('_');

            if (items.Length < 5)
            {
                return false;
            }

            int iAddr = items.Length - 4;
            int iDate = items.Length - 3;
            int iTime = items.Length - 2;

            ipaddr = items[iAddr];

            if (items[iDate].Length != 8 || items[iTime].Length != 6)
            {
                return false;
            }

            items[iDate] = items[iDate].Insert(4, "-");
            items[iDate] = items[iDate].Insert(7, "-");
            items[iTime] = items[iTime].Insert(2, ":");
            items[iTime] = items[iTime].Insert(5, ":");

            datetime = items[iDate] + " " + items[iTime];

            return true;
        }

        static int GetIntFromString(string str)
        {
            try
            {
                return int.Parse(str);
            }
            catch (System.Exception)
            {
                return -1;
            }
        }

        static bool ExtractFromFileData(string filename, out int acntUid, out string loginId, out int userUid, out string nickname, out string version, out string uservoice)
        {
            acntUid = 0;
            userUid = 0;
            loginId = "";
            nickname = "";
            version = "";
            uservoice = "";

            string tempDir = Environment.ExpandEnvironmentVariables(@"%TEMP%\CrashGatherer");

            ICSharpCode.SharpZipLib.Zip.FastZip extractor = new ICSharpCode.SharpZipLib.Zip.FastZip();
            extractor.ExtractZip(filename, tempDir, "userReport.txt");
            extractor.ExtractZip(filename, tempDir, "stack.log");

            string uservoicePath = tempDir + "\\userReport.txt";
            if (System.IO.File.Exists(uservoicePath))
            {
                using (TextReader reader = new StreamReader(uservoicePath, Encoding.Default))
                {
                    uservoice += reader.ReadToEnd();
                }

                System.IO.File.Delete(uservoicePath);
            }

            string stackLogPath = tempDir + "\\stack.log";
            if (System.IO.File.Exists(stackLogPath) == false)
            {
                return false;
            }

            using (TextReader reader = new StreamReader(stackLogPath, Encoding.Default))
            {
                string line = reader.ReadLine();
                if (line != null)
                {
                    string[] seps = new string[] {", "};
                    string[] series = line.Split(seps, StringSplitOptions.RemoveEmptyEntries);

                    if (series.Length < 5)
                        series = line.Split(',');

                    if (series.Length >= 5)
                    {
                        acntUid = GetIntFromString(series[0]);
                        loginId = series[1].Trim();
                        userUid = GetIntFromString(series[2]);
                        nickname = series[3].Trim();
                        if (kBase64Nickname)
                        {
                            byte[] conv = Convert.FromBase64String(nickname);
                            //nickname = Encoding.ASCII.GetString(conv);
                            nickname = Encoding.GetEncoding(0).GetString(conv);
                        }

                        version = series[4].Trim();
                    }
                }

                uservoice += reader.ReadToEnd();
                uservoice = uservoice.Trim();

                reader.Close();
            }

            return true;
        }

        static bool IsValidMinidumpFile(string filename)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("-z {0} -c \"q\"", filename);

            System.Diagnostics.Process cdb = new System.Diagnostics.Process();
            cdb.StartInfo.UseShellExecute = false;
            cdb.StartInfo.FileName = CDBPath;
            cdb.StartInfo.Arguments = sb.ToString();
            cdb.StartInfo.RedirectStandardOutput = true;
            if (cdb.Start() == false)
            {
                Console.WriteLine("Start CDB.EXE failed: {0}", filename);
                return false;
            }

            string output = cdb.StandardOutput.ReadToEnd();
            if (output.EndsWith("quit:\n") == false)
            {
                Console.WriteLine("output log was corrupted: {0}", filename);
                return false;
            }
            cdb.WaitForExit();

            int pos = output.IndexOf("Catastrophic failure");
            if (pos != -1)
            {
                Console.WriteLine("Catastrophic failure: {0}", filename);
                return false;
            }

            return true;
        }

        static string GetCallstackFromMinidump(string filename, string symPath)
        {
            string tempDir = Environment.ExpandEnvironmentVariables(@"%TEMP%\CrashGatherer");
            string[] files = System.IO.Directory.GetFiles(tempDir, "*.dmp");
            foreach (string fn in files)
            {
                System.IO.File.Delete(fn);
            }

            ICSharpCode.SharpZipLib.Zip.FastZip extractor = new ICSharpCode.SharpZipLib.Zip.FastZip();
            extractor.ExtractZip(filename, tempDir, "dmp");

            files = System.IO.Directory.GetFiles(tempDir, "*.dmp");
            if (files.Length < 1)
            {
                Console.WriteLine("no *.dmp in {0}!", filename);
                return "@@@@==== NO *.DMP FILE ====@@@@";
            }

            if (IsValidMinidumpFile(files[0]) == false)
            {
                Console.WriteLine("invalid *.dmp file: {0}", filename);
                return "@@@@==== INVALID *.DMP FILE ====@@@@";
            }

            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("-z {0} -lines -c \".ecxr;kb;q\" -y {1}", files[0], symPath);

            System.Diagnostics.Process cdb = new System.Diagnostics.Process();
            cdb.StartInfo.UseShellExecute = false;
            cdb.StartInfo.FileName = CDBPath;
            cdb.StartInfo.Arguments = sb.ToString();
            cdb.StartInfo.RedirectStandardOutput = true;
            if (cdb.Start() == false)
            {
                Console.WriteLine("Start CDB.EXE failed: {0}", filename);
                return "@@@@==== START CDB.EXE FAILED ====@@@@";
            }

            string output = cdb.StandardOutput.ReadToEnd();
            if (output.EndsWith("quit:\n") == false)
            {
                Console.WriteLine("output log was corrupted: {0}", filename);
                return "@@@@==== OUTPUT LOG WAS CORRUPTED ====@@@@";
            }
            cdb.WaitForExit();

            // 예외 정보가 없는 경우
            if (output.IndexOf("Minidump doesn't have an exception context") != -1)
            {
                return "@@@@==== THREAD HANG (OR EXCEPTION RECORD NOT FOUND) ====@@@@";
            }

            int pos = output.IndexOf("*** Stack trace");
            if (pos == -1)
            {
                // 스택 트레이스 정보가 없는 경우
                return "@@@@==== UNKNOWN *.DMP FORMAT ====@@@@";
            }

            output = output.Substring(pos);

            return output;
        }

        static bool ExtractFromMinidump(string filename, string symPath, ref List<sCallstack> callstack, out byte[] callstackUid) 
        {
            callstackUid = new byte[16];

            string output = GetCallstackFromMinidump(filename, symPath);

            string[] lines = output.Split('\n');
            int depth = 0;
            string haystack = "";
            foreach (string line in lines)
            {
                if (depth > 0)
                    depth++;

                int rearPos = line.IndexOf('[');
                if (rearPos != -1)
                {
                    sCallstack stack = new sCallstack();

                    if (depth == 0)
                        depth = 1;

                    stack.depth = depth;
                    stack.funcname = line.Substring(45, rearPos - 45 - 1);
                    stack.fileline = line.Substring(rearPos);

                    haystack += stack.funcname;

                    callstack.Add(stack);
                }
            }

            if (haystack.Length <= 0)
            {
                lines = output.Split('\n');
                depth = 0;
                foreach (string line in lines)
                {
                    if (depth > 0)
                        depth++;

                    sCallstack stack = new sCallstack();

                    if (depth == 0)
                        depth = 1;

                    stack.depth = depth;
                    stack.funcname = line;
                    stack.fileline = "";

                    haystack += stack.funcname;

                    callstack.Add(stack);
                }
            }

            System.Security.Cryptography.MD5CryptoServiceProvider hashGen = new System.Security.Cryptography.MD5CryptoServiceProvider();
            callstackUid = hashGen.ComputeHash(Encoding.ASCII.GetBytes(haystack));

            return true;
        }

        static bool CollectReportInfo(string filename, string symPath, ref sReportInfo info)
        {
            bool res = false;
            info.ResetReportInfo();

            res = ExtractFromFileData(filename, out info.acnt_uid, out info.login_id, out info.user_uid, out info.nickname, out info.version, out info.uservoice);
            if (res == false)
            {
                Console.WriteLine("ExtractFromFileData() failed");
                return false;
            }

            res = ExtractFromFilename(filename, out info.ipaddr, out info.date);
            if (res == false)
            {
                Console.WriteLine("ExtractFromFilename() failed");
                return false;
            }

            info.signatrue = null;
            info.callstack = new List<sCallstack>();

            res = ExtractFromMinidump(filename, symPath, ref info.callstack, out info.signatrue);
            if (res == false)
            {
                Console.WriteLine("ExtractFromMinidump() failed: filename({0})", filename);
                // flow3r 2008.08.19 <> 미니덤프 추출 결과 상관없이 데이터베이스에 등록하자.
                // return -1;
            }

            return true;
        }

        static bool InsertReport(int project_uid, string filename, string symPath, string connStr, ref string message)
        {
            int report_uid = 0;

            // 1. 수집된 파일 정보 등록
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                DB.InsertReportResult result = DB.Insert_Report_File(conn, filename, out report_uid);
                switch  (result)
                {
                    case DB.InsertReportResult.Error:
                        message = "DB.Insert_Filename failed!";
                        return false;

                    case DB.InsertReportResult.Exists:
                        return true;

                    case DB.InsertReportResult.Inserted:
                        // 계속 분석 시작
                        break;
                }

            }

            // 2.1. 콜스택 분석 및 기초 정보 추출
            sReportInfo info = new sReportInfo();
            if (CollectReportInfo(filename, symPath, ref info) == false)
            {
                message = "CollectReportInfo failed!";
                return false;
            }

            // 2.2. 데이터베이스에 입력
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                SqlTransaction tran = conn.BeginTransaction();

                int callstack_uid = 0;

                // 콜스택 로그를 등록한다. (오류 종류를 구분해서 중복 제거 및 통계 처리를 위해)
                if (info.signatrue != null)
                {
                    bool res = DB.Insert_Callstack(conn, ref tran, project_uid, info.signatrue, out callstack_uid);

                    if (res == false || callstack_uid == 0)
                    {
                        tran.Rollback();

                        message = "DB.Insert_Callstack failed!";
                        return false;
                    }

                    foreach (sCallstack stack in info.callstack)
                    {
                        DB.Insert_Single_Step(conn, tran, callstack_uid, stack);
                    }
                }
                
                if (report_uid != 0)
                {
                    if (DB.Insert_Report_Info(conn, tran, report_uid, callstack_uid, info) == false)
                    {
                        tran.Rollback();

                        message = "DB.Insert_Report_Info failed!";
                        return false;
                    }
                }

                tran.Commit();
            }
            
            return true;
        }

        // get arg without option arg which starts with '--'
        static string[] GetArgsOnly(string[] args)
        {
            List<string> pureArgs = new List<string>();

            foreach (string arg in args)
            {
                if (arg.StartsWith("--"))
                    continue;

                pureArgs.Add(arg);
            }

            return pureArgs.ToArray();
        }

        static void Main(string[] args)
        {
            bool result = false;
            string message = "";

            if (IsCDBExists() == false)
            {
                Console.WriteLine("CDB.EXE not found!\n\n"
                + "\t 1.install 'Debugging Tools for Windows'.\n"
                + "\t 2.register install directory into PATH (environment variable).\n"
                );
                return;
            }

            string[] argOnly = GetArgsOnly(args);

            if (argOnly.Length < 3)
            {
                Console.WriteLine("Description:\n\tCrashGatherer do the following steps.\n"
                + "\t 1. download user-reported zip files reside in an external server.\n"
                + "\t 2. extract zip file.\n"
                + "\t 3. analyse contents in it.\n"
                + "\t 4. put analysed informations into DB.\n");
                Console.WriteLine("Usage: CrashGatherer [--base64-nickname] [original path] [symbol path] [connection string] [project-uid]");
                return;
            }

            // for all zip files
            string original_path = argOnly[0]; // @"\\yourserver\yourpath\crash\www\reported files";
            string symbol_path  = argOnly[1]; // @"\\yourserver\yourpath\@sym";
            string connectionStr = argOnly[2]; // @"server=NetNameOrIP,PORT;database=crashweb;Uid=YourUserID;Password=YourPassword;";
            int project_uid = 1;

            if (argOnly.Length >= 4)
            {
                project_uid = GetIntFromString(argOnly[3]);
            }

            // --로 시작하는 옵션 읽기
            foreach (string arg in args)
            {
                if (arg == "--base64-nickname")
                {
                    kBase64Nickname = true;
                }
            }

            // 1. 파일 목록 작성
            string[] files = null;
            try
            {
                files = Directory.GetFiles(original_path, "*.zip");
            }
            catch (System.Exception e)
            {
                Console.WriteLine("Original Path Unavailable: {0}", e.Message);
                return;
            }

            try
            {
                // 2. 순회하면서 분석하고 DB에 저장
                foreach (string file in files)
                {
                    int pos = file.LastIndexOf('\\');
                    if (pos == -1)
                    {
                        Console.WriteLine("bad filename: {0}", file);
                    }

                    string localCopy = "reports/" + file.Substring(pos + 1);

                    /* flow3r 2010-05-26 <> 받은 것도 일단은 처리하고, 판단은 DB가 하도록 수정.
                    if (File.Exists(localCopy))
                    { // 이미 받은 파일은 건너뛰기
                        continue;
                    }
                    */

                    // 2.1. 오류 보고 파일 내려받기
                    Directory.CreateDirectory("reports");
                    if (File.Exists(localCopy) == false)
                    {
                        File.Copy(file, localCopy);
                    }

                    // 2.2. 정보 분석해서 데이터베이스에 밀어넣기
                    try
                    {
                        result = InsertReport(project_uid, localCopy, symbol_path, connectionStr, ref message);
                    }
                    catch (System.Exception e)
                    {
                        Console.WriteLine("InsertReport() fail: {0}", e.Message);
                    }

                    if (result == false)
                    {
                        Console.WriteLine("RESULT:{0}, {1}", file, message);
                    }
                }
            }
            catch (System.Exception ex)
            {
                Console.WriteLine("{0} => {1}", ex.Message, ex.StackTrace);
            }
        }
    }
}
