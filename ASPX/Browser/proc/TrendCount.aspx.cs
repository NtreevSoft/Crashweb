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
    using DailyCountList = System.Collections.Generic.Dictionary<string, int>;
    using TrendCountList = System.Collections.Generic.Dictionary<string, System.Collections.Generic.Dictionary<string, int>>;

    public partial class TrendCount : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Response.ContentEncoding = System.Text.Encoding.UTF8;
            Response.ContentType = "text/xml";
            Response.Cache.SetCacheability(HttpCacheability.NoCache);

            int callstack_uid;
            short fromDate = 60;
            short toDate = 0;

            if (int.TryParse(Request.QueryString["callstack_uid"], out callstack_uid) == false)
                callstack_uid = 1;

            using (System.Xml.XmlTextWriter writer = new System.Xml.XmlTextWriter(Response.OutputStream, System.Text.Encoding.UTF8))
            {
                writer.WriteStartDocument();
                writer.WriteStartElement("Counts");

                TrendCountList trendCount = new TrendCountList();

                DB.LoadTrendCount(callstack_uid, fromDate, toDate,
                    delegate(string version, string date, int count)
                    {
                        //dailyCountList[date] = count;

                        DailyCountList dcl;
                        if (trendCount.TryGetValue(version, out dcl) == false)
                        {
                            trendCount[version] = new DailyCountList();
                            for (int i = fromDate; i >= toDate; i--)
                            {
                                TimeSpan days = new TimeSpan(i, 0, 0, 0);
                                DateTime saveDate = DateTime.Now.Subtract(days);

                                string simulated_date = string.Format("{0:0000}-{1:00}-{2:00}", saveDate.Year, saveDate.Month, saveDate.Day);

                                trendCount[version][simulated_date] = 0;
                            }
                        }

                        trendCount[version][date] = count;
                    }
                );

                foreach (KeyValuePair<string, DailyCountList> trend in trendCount)
                {
                    writer.WriteStartElement("Version");
                    writer.WriteAttributeString("name", trend.Key.Replace("\0", ""));

                    foreach (KeyValuePair<string, int> v in trend.Value)
                    {
                        writer.WriteStartElement("Count");
                        writer.WriteAttributeString("date", v.Key);
                        writer.WriteAttributeString("count", v.Value.ToString());
                        writer.WriteEndElement();
                    }

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