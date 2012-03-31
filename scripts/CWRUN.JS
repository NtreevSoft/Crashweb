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

var fso = new ActiveXObject("Scripting.FileSystemObject");
var sho = new ActiveXObject("WScript.Shell");

// helper functions ---------------------------------------------------------------------------------------------------------------------
function trim(s)
{
  return s.replace(/^\s+/,'').replace(/\s+$/,'');
}

function ReadConfig()
{
  var ret = {};

  var forReading = 1;
  var f = fso.OpenTextFile(sho.CurrentDirectory + '\\CWRUN.config', forReading);
  while (!f.AtEndOfStream) {
    var line = trim(f.ReadLine());
    if (line.indexOf(';') == 0 || !line.length)
      continue;

    var pos = line.indexOf('=');
    if (pos == -1)
      continue;

    var key = trim(line.substr(0,pos));
    var val = trim(line.substr(pos+1));

    ret[key] = val;
  }

  return ret;
}

// ---------------------------------------------------------------------------------------------------------------------
function main()
{
  var projectUid = "1 ";
  var configs = ReadConfig();
  for (key in configs)
  {
    switch (key)
    {
    case 'report_path': reportPath = " \"" + configs[key] + "\""; break;
    case 'symbol_server': symServer = " \"" + configs[key] + "\""; break;
    case 'connection_string': connString = "\"" + configs[key] + "\""; break;
    case 'project_uid': projectUid = " \"" + configs[key] + "\""; break;
    }
  }

  var message = "";

  sho.Run("cmd /c mkdir log", 0, true);

  try
  {
    sho.Run("cmd /c echo %DATE% %TIME% START... >> log\\CrashGatherer.%DATE%.log", 0, true);
    sho.Run("cmd /c echo Executing: CrashGatherer.exe " + reportPath + symServer + connString + " >> log\\CrashGatherer.%DATE%.log", 0, true);
    sho.Run("cmd /c CrashGatherer.exe" + reportPath + symServer + connString + projectUid + " >> log\\CrashGatherer.%DATE%.log", 0, true);
    sho.Run("cmd /c echo %DATE% %TIME% OK! >> log\\CrashGatherer.%DATE%.log", 0, true);
  }
  catch(e)
  {
    return "ERROR: Cannot execute CrashGatherer.exe.\r\n\r\n" + e.message;
  }

  return message;
}

var m = main();
if (m.length > 0)
{
  WScript.Echo(m);
}
