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

function alert(s) { WScript.Echo(s); }
function errorlog(s) {

  //  make sure log path exists
  sho.Run("cmd /c mkdir log", 0, true);

  var forAppending = 8;
  var now = new Date();
  var f = fso.OpenTextFile(sho.CurrentDirectory + '\\log\\DeleteOld.log', forAppending, true);
  f.WriteLine(now.toLocaleString() + ': ' + s);
  f.Close();
}

function Folder2Array(arr, pathName)
{
    var path = fso.GetFolder(pathName);
    
    var fileIter = new Enumerator(path.Files);
    for (; !fileIter.atEnd(); fileIter.moveNext())
    {
        var file = fileIter.item();

        arr.push(file);
    }

    var subfIter = new Enumerator(path.SubFolders);
    for (; !subfIter.atEnd(); subfIter.moveNext())
    {
        var subf = subfIter.item();

        Folder2Array(arr, pathName + "\\" + subf.Name);
    }

    return arr;
}

function IsSameDate(d1,d2)
{
    d1 = Date.parse(d1);
    d2 = Date.parse(d2);

    return Math.abs(d2 - d1) < 30000; // 시간차가 30초 미만이면
}

function DeleteIt(file)
{
    //alert(file.Name + " : " + file.DateLastModified);
    fso.DeleteFile(file, true);
}

function DeleteOld(pathName)
{
    var arrPath = new Array();
    Folder2Array(arrPath, pathName)

    var msecOfOneDay = 1000 * 60 * 60 * 24;
    var msecToSub = msecOfOneDay * 60; // 약 두 달(60일)을 빼서

    var saveNow = new Date();
    saveNow = saveNow.valueOf() - msecToSub;

    var selected = 0;
    for (var p in arrPath)
    {
        var lastModified = Date.parse(arrPath[p].DateLastModified);
        if (lastModified < saveNow)
        {
            DeleteIt(arrPath[p])
            selected++;
        }
    }

    //alert(selected);
}

function trim(s)
{
  return s.replace(/^\s+/,'').replace(/\s+$/,'');
}

function GetDeletePathList()
{
  var ret = [];

  var forReading = 1;
  var f = fso.OpenTextFile(sho.CurrentDirectory + '\\DeleteOld.config', forReading);
  while (!f.AtEndOfStream) {
    var line = trim(f.ReadLine());
    if (line.indexOf(';') == 0 || !line.length)
      continue;
    ret.push(line);
  }

  return ret;
}

function main()
{
  var pathList = GetDeletePathList();
  for (idx in pathList)
  {
    var path = pathList[idx];
    try
    {
      DeleteOld(path);
    }
    catch(e)
    {
      errorlog('ERROR: failed to delete ' + path + ' (reason: ' + e.message + ')');
    }
  }
}

main();