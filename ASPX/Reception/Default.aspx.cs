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
using System.Data;
using System.Configuration;
using System.Collections;
using System.Diagnostics;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.IO;
using System.Runtime.InteropServices;

namespace Reception
{
    public enum ErrorCode
    {
        E_REPORT_SUCCESS,
        E_REPORT_REQUEST_ERROR,
        E_REPORT_SAVEAS_ERROR,
    };

    public partial class _Default : System.Web.UI.Page
    {
        private string kDownloadPath = @"C:\yourpath\www\reported files\";

        private bool WriteEventLog(ErrorCode errorCode, string errorMessage)
        {
            // http://support.microsoft.com/kb/307024 이벤트 로그 남기는 법
            // http://support.microsoft.com/kb/329291 보안 설정에 따른 이벤트 로그 작성 안되는 문제 해결하기

            string appName = "Crash Reporter (Default.aspx Component)";

            try
            {
                EventLog.WriteEntry(appName, errorMessage, EventLogEntryType.Error, (int)errorCode);
            }
            catch (Exception)
            {
                return false;
            }

            return true;
        }

        private String MakeValidPath(string targetDir)
        {
        #if VER_WEBIMAGE
            System.Text.StringBuilder filename = new System.Text.StringBuilder();
            #if TEST_CODE
                filename.AppendFormat("v2_{0}.txt", Request.UserHostAddress);
            #else
                System.Text.StringBuilder type = new System.Text.StringBuilder(Request.QueryString["type"]);
                filename.AppendFormat("v2_{0}_{1}.png", Request.UserHostAddress, type);
            #endif
        #else
            System.Text.StringBuilder filename = new System.Text.StringBuilder(Request.QueryString["loginid"]);

            if (filename == null || filename.Length == 0)
                filename.Append("(null)");

            System.DateTime saveNow = DateTime.Now;

            filename.AppendFormat("_{0}", Request.UserHostAddress);
            filename.AppendFormat("_{0:D2}{1:D2}{2:D2}_{3:D2}{4:D2}{5:D2}_{6:D3}.zip"
                , saveNow.Year
                , saveNow.Month
                , saveNow.Day
                , saveNow.Hour
                , saveNow.Minute
                , saveNow.Second
                , saveNow.Millisecond);
        #endif
            string targetPath = targetDir.Replace('/', '\\');
            if (targetPath.EndsWith("\\") == false)
                targetPath += '\\';

            System.IO.Directory.CreateDirectory(targetPath);

            return targetPath + filename;
        }

    #if VER_WEBIMAGE
        const int CHECK_SUM_SIZE = 8;
        const int CHECK_SUM_PIVOT = 2;
        const int CHECK_SUM_OFFSET = 6;
        const int IMG_HEADER_SIZE = 128;
        const int IMG_HEADER_XOR = 0xA5; // 10100101;
        private bool TestCheckSum(byte[] buffer, int pivot)
        {
            int[] key = new int[8];
            key[0] = 8;
            key[1] = 33;
            key[2] = 52;
            key[3] = 86;
            key[4] = 101;
            key[5] = 129;
            key[6] = 226;
            key[7] = 245;

            //FileStream fs = new FileStream("E:/AppServer/webimage/a.bin", FileMode.Append, FileAccess.Write, FileShare.Write);
            for (int i = 0; i < CHECK_SUM_SIZE; ++i)
            {
                int value = 0;
                for (int j = 0; j < CHECK_SUM_OFFSET; ++j)
                    value += buffer[pivot + (key[i] * j)];
                //fs.WriteByte((byte)(value % 0xff));
                if (buffer[i] != (value % 0xff))
                    return false;
            }
            //fs.Close();

            return true;
        }
    #endif

        protected void Page_Load(object sender, EventArgs e)
        {
            kDownloadPath = System.Configuration.ConfigurationManager.AppSettings["downloadPath"];
            System.String ipaddr = Request.UserHostAddress;

            ErrorCode errorCode = ErrorCode.E_REPORT_SUCCESS;
            string errorMessage = null;

            if (Request.TotalBytes > 0)
            {
                try
                {
                #if VER_WEBIMAGE
                    unsafe
                    {
                        byte[] buffer = Request.BinaryRead(Request.TotalBytes);

                    #if TEST_CODE
                        FileStream fs = new FileStream(MakeValidPath(kDownloadPath), FileMode.Create, FileAccess.Write, FileShare.Write);
                        fs.Write(buffer, 0, Request.TotalBytes);
                        fs.Close();
                    #else
                        // 1단계 : 체크섬
                        if (TestCheckSum(buffer, Request.TotalBytes / CHECK_SUM_PIVOT))
                        {
                            // 2단계 : 헤더 XOR 제거
                            for (int i = 0; i < IMG_HEADER_SIZE; ++i)
                                buffer[CHECK_SUM_SIZE + i] ^= IMG_HEADER_XOR;

                            FileStream fs = new FileStream(MakeValidPath(kDownloadPath), FileMode.Create, FileAccess.Write, FileShare.Write);
                            fs.Write(buffer, CHECK_SUM_SIZE, Request.TotalBytes - CHECK_SUM_SIZE);
                            fs.Close();
                        }
                    #endif
                    }
                #else
                    Request.SaveAs(MakeValidPath(kDownloadPath), false);
                #endif
                }
                catch (Exception exception)
                {
                    errorCode = ErrorCode.E_REPORT_SAVEAS_ERROR;
                    errorMessage = exception.Message;
                }
            }

            // flow3r 2010.03.12 <> 데이터 없으면 그냥 무시하도록 수정.
            //else
            //{
            //    errorCode = ErrorCode.E_REPORT_REQUEST_ERROR;
            //    errorMessage = string.Format("Invalid TotalBytes.");
            //}

            if (errorCode != ErrorCode.E_REPORT_SUCCESS)
            {
                // flow3r 2008.01.02 <> 서버에 이벤트 로그 남김.
                // flow3r 2010.03.12 <> 클라이언트 IP 정보 추가.
                if (WriteEventLog(errorCode, errorMessage + "(from " + ipaddr + ")") == false)
                {
                    errorMessage += string.Format(Environment.NewLine + "WriteEventLog() fail.");
                }

                // flow3r 2008.01.02 <> 유저에게 결과 리포트.
                Response.Write((int)errorCode);
                Response.Write(Environment.NewLine + errorMessage);
            }
        }
    }
}
