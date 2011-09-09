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
using System.Web;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.Diagnostics;

namespace Browser.mod
{
    public class DB
    {
        private static string connectionString;
        private static int kSampleBegin = 30;
        private static int kSampleEnd   = 0;

        static DB()
        {
            if (ConfigurationManager.ConnectionStrings["crashweb"] != null)
            {
                connectionString = ConfigurationManager.ConnectionStrings["crashweb"].ConnectionString;
            }
        }

        private static string RemoveUnwantedChars(string str)
        {
            // flow3r 2010-05-27 <> remove control characters from version string

            for (char i = '\0'; i < 0x20; ++i)
            {
                str = str.Replace("" + i, "");
            }

            return str;
        }

        private static string GetRelativeTimeString(DateTime dateTime)
        {
            System.TimeSpan beforeNow = DateTime.Now - dateTime;

            string relativeTime = "약 ";
            if (Math.Round(beforeNow.TotalDays) > 0)
            {
                relativeTime += Math.Round(beforeNow.TotalDays) + "일 전";
            }
            else if (Math.Floor(beforeNow.TotalHours) > 0)
            {
                relativeTime += Math.Round(beforeNow.TotalHours) + "시간 전";
            }
            else
            {
                relativeTime += Math.Round(beforeNow.TotalMinutes) + "분 전";
                //mostRecent = true;
            }

            return relativeTime;
        }

        public static bool LoadProject(out Dictionary<int, sProject> projectList)
        {
            projectList = new Dictionary<int, sProject>();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_project_all", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        sProject projectItem;

                        projectItem.uid = reader.GetInt32(0);
                        projectItem.name = reader.GetString(1);

                        projectList.Add(projectItem.uid, projectItem);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public delegate void ForEachCallstack(int report_uid, string login_id, string ipaddr, DateTime reported_time, string relative_time, int callstack_uid, string funcname, string version, string filename, string assigned, string uservoice, int num_comments);
        public enum ReportWhereFilter { None, FilterID, FilterIP, };

        private static void DelegateReport(SqlDataReader reader, ForEachCallstack func)
        {
            int reportUid = reader.GetInt32(0);
            string loginId = reader.GetString(1);
            string ipaddr = reader.GetString(2);
            DateTime reportedTime = reader.GetDateTime(3); // 보고를 받은 시각
            string relativeTime = GetRelativeTimeString(reportedTime);

            int callstackUid = reader.GetInt32(4);
            string funcname = reader.GetString(5);
            string version = reader.GetString(6);
            string filename = reader.GetString(7);

            //bool resolved = false;
            //if (reader.IsDBNull(8) == false)
            //    resolved = reader.GetBoolean(8);

            string assigned = "";
            if (reader.IsDBNull(8) == false)
                assigned = reader.GetString(8);

            string uservoice = reader.GetString(9);
            int num_comment = reader.GetInt32(10);

            func(reportUid, RemoveUnwantedChars(loginId), ipaddr, reportedTime, relativeTime, callstackUid, funcname, RemoveUnwantedChars(version), filename, assigned, RemoveUnwantedChars(uservoice), num_comment);

            //string trClass = "normal";
            //if (mostRecent)
            //    trClass = "recent";
            //if (resolved)
            //    trClass = "grayed";
        }

        public static bool LoadReport(int project_uid, int pageNo, int pageSize, ForEachCallstack func, out int totalPageSize, ReportWhereFilter filterType = ReportWhereFilter.None, string filterValue = "", int hideResolved = 0)
        {
            totalPageSize = 0;

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_recent_reports", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    SqlParameter returned = cmd1.CreateParameter();
                    returned.Direction = ParameterDirection.ReturnValue;
                    cmd1.Parameters.Add(returned);

                    cmd1.Parameters.AddWithValue("@project_uid", project_uid);
                    cmd1.Parameters.AddWithValue("@where", filterType);
                    cmd1.Parameters.AddWithValue("@filter", filterValue);
                    cmd1.Parameters.AddWithValue("@pageNumber", pageNo);
                    cmd1.Parameters.AddWithValue("@cntPerPage", pageSize);
                    cmd1.Parameters.AddWithValue("@hideResolved", hideResolved);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        DelegateReport(reader, func);
                    }

                    reader.Close();

                    double numItems = (int)returned.Value;
                    totalPageSize = (int)Math.Ceiling(numItems / pageSize);
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool LoadReportDeleted(int project_uid, ForEachCallstack func)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_report_deleted", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@project_uid", project_uid);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        DelegateReport(reader, func);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool LoadCallstackPreview(int callstack_uid, out string callstack)
        {
            callstack = "";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_callstack_preview", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        callstack += reader.GetString(0);
                        callstack += "\r\n";
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public delegate void ForEachCallstackGroup(int count, int callstack_uid, string funcname, string version, DateTime latest_time, string relative_time, string assigned, int num_comments);

        /** 콜스택 목록 가져오기
         *	
         *	@param  seperate_version    true이면 버전을 구분해서 정보를 가져온다. false이면 버전을 구분하지 않고 가져온다.
         *	@param  specific_version    특정 버전의 정보만 가져온다. 이 값이 null이 아니면, seperate_version 값은 무시된다.
         *	
         */
        public static bool LoadCallstackList(int project_uid, int pageNo, int pageSize, int fromDate, int toDate, bool seperate_version, string specific_version, int hideResolved, ForEachCallstackGroup func, out int totalPageSize)
        {
            totalPageSize = 0;

            if (fromDate < 0)
                fromDate = kSampleBegin;
            if (toDate < 0)
                toDate = kSampleEnd;

            string procedureName = "usp_select_recent_report_groups";
            if (seperate_version == false && specific_version == null)
                procedureName = "usp_select_recent_report_groups_only";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand(procedureName, conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    SqlParameter returned = cmd1.CreateParameter();
                    returned.Direction = ParameterDirection.ReturnValue;
                    cmd1.Parameters.Add(returned);

                    cmd1.Parameters.AddWithValue("@project_uid", project_uid);
                    cmd1.Parameters.AddWithValue("@day_from", fromDate);
                    cmd1.Parameters.AddWithValue("@day_to", toDate);
                    cmd1.Parameters.AddWithValue("@pageNumber", pageNo);
                    cmd1.Parameters.AddWithValue("@cntPerPage", pageSize);
                    cmd1.Parameters.AddWithValue("@hideResolved", hideResolved);

                    if (specific_version != null)
                        cmd1.Parameters.AddWithValue("@specific_version", specific_version);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        int count = reader.GetInt32(0);
                        int callstackUid = reader.GetInt32(1);
                        string funcname = reader.GetString(2);
                        string version = reader.GetString(3);

                        DateTime latestTime = reader.GetDateTime(4); // 가장 최근에 보고를 받은 시각
                        string relativeTime = GetRelativeTimeString(latestTime);

                        string assinged = reader.GetString(5);
                        int num_comments = reader.GetInt32(6);

                        func(count, callstackUid, funcname, RemoveUnwantedChars(version), latestTime, relativeTime, assinged, num_comments);
                    }

                    reader.Close();

                    double numItems = (int)returned.Value;
                    totalPageSize = (int)Math.Ceiling(numItems / pageSize);
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public delegate void ForEachSinglestep(int depth, string funcname, string fileline);

        public static bool LoadCallstack(int callstack_uid, ForEachSinglestep func)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_callstack_by_callstack_uid", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        int depth = reader.GetInt16(0);
                        string funcname = reader.GetString(1);
                        string fileline = reader.GetString(2);

                        func(depth, funcname, fileline);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool LoadSameReport(int callstack_uid, ForEachCallstack func)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_report_by_callstack_uid", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        DelegateReport(reader, func);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool UpdateCallstackState(int callstack_uid, string state)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_update_callstack_state", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);
                    cmd1.Parameters.AddWithValue("@new_state", state);

                    cmd1.ExecuteNonQuery();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool UpdateReportState(int report_uid, int state)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_update_report_state", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@report_uid", report_uid);
                    cmd1.Parameters.AddWithValue("@new_state", state);

                    cmd1.ExecuteNonQuery();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        /** 일자별 발생 횟수를 카운트
         *	
         *	@param  day_from   시작일 (현재를 기준으로 며칠 전인가, 예: 15일 전부터 보려면 15)
         *	@param  day_to     마지막 일 (예: 오늘까지 보려면 0, 어제까지 보려면 1)
         */
        public delegate void ForEachDailyCount(string date, int count);

        public static bool LoadDailyCount(int project_uid, short fromDate, short toDate, ForEachDailyCount func)
        {
            if (fromDate <= 0)
                fromDate = (short)kSampleBegin;
            if (toDate < 0)
                toDate = (short)kSampleEnd;

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_daily_count", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@project_uid", project_uid);
                    cmd1.Parameters.AddWithValue("@day_from", fromDate);
                    cmd1.Parameters.AddWithValue("@day_to", toDate);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        string date = reader.GetString(0);
                        int count = reader.GetInt32(1);

                        func(date, count);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        /** 버전별, 일자별 발생 횟수를 카운트
         *	
         *	@param  day_from 시작일 (현재를 기준으로 며칠 전인가, 예: 15일 전부터 보려면 15)
         *	@param  day_to   마지막 일 (예: 오늘까지 보려면 0, 어제까지 보려면 1)
         */
        public delegate void ForEachTrendCount(string version, string date, int count);

        public static bool LoadTrendCount(int callstack_uid, short fromDate, short toDate, ForEachTrendCount func)
        {
            if (fromDate <= 0)
                fromDate = (short)kSampleBegin;
            if (toDate < 0)
                toDate = (short)kSampleEnd;

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_daily_count_per_version", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);
                    cmd1.Parameters.AddWithValue("@day_from", fromDate);
                    cmd1.Parameters.AddWithValue("@day_to", toDate);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        string version = reader.GetString(0);
                        string date = reader.GetString(1);
                        int count = reader.GetInt32(2);

                        func(version, date, count);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool ReserveReparse(int project_uid, int report_uid, string version)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_update_report_delete", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@project_uid", project_uid);
                    cmd1.Parameters.AddWithValue("@report_uid", report_uid);
                    cmd1.Parameters.AddWithValue("@version", version);

                    cmd1.ExecuteNonQuery();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public static bool InsertCallstackComment(int callstack_uid, string author, string comment)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_insert_comment", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);
                    cmd1.Parameters.AddWithValue("@author", author);
                    cmd1.Parameters.AddWithValue("@comment", comment);

                    cmd1.ExecuteNonQuery();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }

        public delegate void ForEachCallstackComment(string author, string comment, DateTime created);
        public static bool LoadCallstackComment(int callstack_uid, ForEachCallstackComment func)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                try
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("usp_select_comment", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;

                    cmd1.Parameters.AddWithValue("@callstack_uid", callstack_uid);

                    SqlDataReader reader = cmd1.ExecuteReader();

                    while (reader.Read())
                    {
                        string author = reader.GetString(0);
                        string comment = reader.GetString(1);
                        DateTime created = reader.GetDateTime(2);

                        func(author, comment, created);
                    }

                    reader.Close();
                }
                catch (System.Exception)
                {
                    return false;
                }
            }

            return true;
        }
    }
}
