﻿/*
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
    public partial class CallstackView : System.Web.UI.Page
    {
        private void WriteCData(System.Xml.XmlTextWriter writer, string tag, string value)
        {
            writer.WriteStartElement(tag);
            writer.WriteCData(value);
            writer.WriteEndElement();
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            Response.ContentEncoding = System.Text.Encoding.UTF8;
            Response.ContentType = "text/xml";
            Response.Cache.SetCacheability(HttpCacheability.NoCache);

            int callstack_uid;

            if (int.TryParse(Request.QueryString["callstack_uid"], out callstack_uid) == false)
                callstack_uid = 1;

            using (System.Xml.XmlTextWriter writer = new System.Xml.XmlTextWriter(Response.OutputStream, System.Text.Encoding.UTF8))
            {
                writer.WriteStartDocument();
                writer.WriteStartElement("Callstack");

                DB.LoadCallstack(callstack_uid,
                    delegate(int depth, string funcname, string fileline)
                    {
                        writer.WriteStartElement("Singlestep");
                        writer.WriteAttributeString("depth", depth.ToString());
                        this.WriteCData(writer, "Funcname", funcname);
                        this.WriteCData(writer, "Fileline", fileline);
                        writer.WriteEndElement();
                    }
                );

                writer.WriteEndElement();
                writer.WriteEndDocument();
                writer.Flush();
                writer.Close();
            }
        }
    }
}