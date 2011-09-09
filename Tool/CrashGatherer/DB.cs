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
using System.IO;
using System.Data;
using System.Data.SqlClient;

namespace CrashGatherer
{
    class DB
    {
        public enum InsertReportResult { Error, Exists, Inserted };
        public static InsertReportResult Insert_Report_File(SqlConnection conn, string filename, out int report_uid)
        {
            report_uid = 0;

            try
            {
                SqlCommand cmd1 = new SqlCommand("usp_insert_report_file", conn);
                cmd1.CommandType = CommandType.StoredProcedure;

                SqlParameter returned = cmd1.CreateParameter();
                returned.Direction = ParameterDirection.ReturnValue;

                SqlParameter reportUid = cmd1.CreateParameter();
                reportUid.SqlDbType = SqlDbType.Int;
                reportUid.ParameterName = "@report_uid";
                reportUid.Direction = ParameterDirection.Output;

                cmd1.Parameters.Add(returned);
                cmd1.Parameters.AddWithValue("@filename", filename);
                cmd1.Parameters.Add(reportUid);

                cmd1.ExecuteNonQuery();

                report_uid = (int)reportUid.Value;

                int returnValue = (int)returned.Value;
                if (returnValue == 100)
                {
                    return InsertReportResult.Exists;
                }
            }
            catch (System.Exception e)
            {
                Console.WriteLine(e.Message);
                return InsertReportResult.Error;
            }

            return InsertReportResult.Inserted;
        }

        public static bool Insert_Callstack(SqlConnection conn, ref SqlTransaction tran, int project_uid, byte[] signature, out int callstack_uid)
        {
            callstack_uid = 0;

            try
            {
                SqlCommand cmd1 = new SqlCommand("usp_insert_callstack", conn, tran);
                cmd1.CommandType = CommandType.StoredProcedure;

                SqlParameter returned = cmd1.CreateParameter();
                returned.Direction = ParameterDirection.ReturnValue;

                cmd1.Parameters.Add(returned);
                cmd1.Parameters.AddWithValue("@project_uid", project_uid);
                cmd1.Parameters.AddWithValue("@signature", signature);

                cmd1.ExecuteNonQuery();

                callstack_uid = (int)returned.Value;
            }
            catch (System.Exception e)
            {
                Console.WriteLine(e.Message);
                return false;
            }

            return true;
        }

        public static bool Insert_Single_Step(SqlConnection conn, SqlTransaction tran, int callstack_uid, Program.sCallstack info)
        {
            try
            {
                SqlCommand cmd1 = new SqlCommand("usp_insert_singlestep", conn, tran);
                cmd1.CommandType = CommandType.StoredProcedure;

                cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);
                cmd1.Parameters.AddWithValue("@depth", info.depth);
                cmd1.Parameters.AddWithValue("@funcname", info.funcname);
                cmd1.Parameters.AddWithValue("@fileline", info.fileline);

                cmd1.ExecuteNonQuery();
            }
            catch (System.Exception e)
            {
                Console.WriteLine(e.Message);
                return false;
            }

            return true;
        }

        public static bool Insert_Report_Info(SqlConnection conn, SqlTransaction tran, int report_uid, int callstack_uid, Program.sReportInfo info)
        {
            int returnCode = 0;
            try
            {
                SqlCommand cmd2 = new SqlCommand("usp_insert_report_info", conn, tran);
                cmd2.CommandType = CommandType.StoredProcedure;
                SqlParameter returned = cmd2.CreateParameter();
                returned.Direction = ParameterDirection.ReturnValue;
                cmd2.Parameters.Add(returned);
                cmd2.Parameters.AddWithValue("@report_uid", report_uid);
                cmd2.Parameters.AddWithValue("@acnt_uid", info.acnt_uid);
                cmd2.Parameters.AddWithValue("@login_id", info.login_id);
                cmd2.Parameters.AddWithValue("@user_uid", info.user_uid);
                cmd2.Parameters.AddWithValue("@nickname", info.nickname);
                cmd2.Parameters.AddWithValue("@ipaddr", info.ipaddr);
                cmd2.Parameters.AddWithValue("@datetime", info.date);
                cmd2.Parameters.AddWithValue("@version", info.version);
                cmd2.Parameters.AddWithValue("@callstack_uid", callstack_uid);
                cmd2.Parameters.AddWithValue("@uservoice", info.uservoice);

                cmd2.ExecuteNonQuery();

                returnCode = (int)returned.Value;
            }
            catch (System.Exception e)
            {
                Console.WriteLine(e.Message);
                return false;
            }

            if (returnCode != 0)
            {
                Console.WriteLine("usp_insert_report_info fail: {0}", returnCode);
                return false;
            }

            return true;
        }

    }
}
