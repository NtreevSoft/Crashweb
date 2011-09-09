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

// ---------------------------------------------------------------------------------------------------------------------
// local settings

var reportPath = "\"C:\\yourpath\\crashweb\\reported files\" ";
var symServer  = "\"C:\\yourpath\\@sym\" ";
var connString = "\"server=Server,Port;database=CRASHWEB_DB;Uid=CrashwebUser;Password=****;\" ";

// ---------------------------------------------------------------------------------------------------------------------
function main()
{
    var message = "";

    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var sho = new ActiveXObject("WScript.Shell");

    sho.Run("cmd /c mkdir log", 0, true);

    try
    {
        sho.Run("cmd /c echo %DATE% %TIME% START... >> log\\CrashGatherer.%DATE%.log", 0, true);
//        sho.Run("cmd /c ..\\bin\\CrashGatherer.exe " + reportPath + symServer + connString + " >> log\\CrashGatherer.%DATE%.log", 0, true);
        sho.Run("cmd /c CrashGatherer.exe " + reportPath + symServer + connString + " >> log\\CrashGatherer.%DATE%.log", 0, true);
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
