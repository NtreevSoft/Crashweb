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
using System.Web.UI;
using System.Web.UI.WebControls;
using Browser.mod;

namespace Browser.proc
{
    public partial class DailyCount : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Response.ContentEncoding = System.Text.Encoding.UTF8;
            Response.ContentType = "text/xml";
            Response.Cache.SetCacheability(HttpCacheability.NoCache);

            int project_uid;
            short fromDate = 0;
            short toDate = 0;

            if (int.TryParse(Request.QueryString["project"], out project_uid) == false)
                project_uid = 1;

            if (short.TryParse(Request.QueryString["from"], out fromDate) == false)
                fromDate = 0;

            if (short.TryParse(Request.QueryString["to"], out toDate) == false)
                toDate = 0;

            if (toDate > fromDate)
                return;

            using (System.Xml.XmlTextWriter writer = new System.Xml.XmlTextWriter(Response.OutputStream, System.Text.Encoding.UTF8))
            {
                writer.WriteStartDocument();
                writer.WriteStartElement("Counts");

                Dictionary<string, int> dailyCountList = new Dictionary<string, int>();

                for (int i = toDate; i < fromDate; i++)
                {
                    TimeSpan oneDay = new TimeSpan(i, 0, 0, 0);
                    DateTime saveDate = DateTime.Now.Subtract(oneDay);

                    string date = string.Format("{0:0000}-{1:00}-{2:00}", saveDate.Year, saveDate.Month, saveDate.Day);

                    dailyCountList[date] = 0;
                }

                DB.LoadDailyCount(project_uid, fromDate, toDate,
                    delegate(string date, int count)
                    {
                        dailyCountList[date] = count;
                    }
                );

                foreach (KeyValuePair<string,int> v in dailyCountList)
                {
                    writer.WriteStartElement("Count");
                    writer.WriteAttributeString("date", v.Key);
                    writer.WriteAttributeString("count", v.Value.ToString());
                    writer.WriteEndElement();
                }

                writer.WriteEndElement();
                writer.WriteEndDocument();
                writer.Flush();
                writer.Close();
            }
        }
    }
}