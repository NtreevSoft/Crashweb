<!-- 
Crashweb
https://github.com/NtreevSoft/Crashweb

Released under the MIT License.

Copyright (c) 2008 Ntreev Soft co., Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the 
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the 
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="Browser._Default" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
    <title>크래시웹 v2.1</title>
    <link rel="stylesheet" href="site.css?20110526001" type="text/css" />
    <link rel="stylesheet"  href="jquery-ui-1.8.13.custom.css" type="text/css" />
    <!--script type="text/javascript" src="jquery-1.4.2.min.js"></script-->
    <script type="text/javascript" src="jquery-1.5.1.min.js"></script>
    <script type="text/javascript" src="jquery.cookie.js?20110526001"></script>
    <script type="text/javascript" src="jquery.history.js?20110526001"></script>
    <script type="text/javascript" src="jquery-ui-1.8.13.custom.min.js"></script>
    <script type="text/javascript" src="jquery.ui.datepicker-ko.js?20110526001"></script>
    <script type="text/javascript" src="site.config?20120331001"></script>
    <script type="text/javascript" src="site.js?20120331001"></script>
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript">
      google.load("visualization", "1", {packages:["corechart"]});
    </script>
</head>
<body>
    <div id="tooltip"></div>
    <div id="comment_box" class='radius'>
        <div id="comment_box_close"><a style="cursor:pointer">(Ｘ)</a></div>
        <div id="comments">
        </div>
        <input id="author" type="text" placeholder="작성자" />
        <input id="comment" type="text" placeholder="코멘트" />
    </div>
    <div class="clear"></div>
    <div id="header">
        <ul id="menu">
                <li id="project" class='menu'></li>
                <li class='menu'><img src="img/icon_clock.gif" /> <a id="menu_anchor_1">일별 추이</a></li>
                <li class='menu'><img src="img/action_refresh_blue.gif" /> <a id="menu_anchor_2">최근 30개</a></li>
                <li class='menu'><img src="img/comment_new.gif" /> <a id="menu_anchor_3" class="selected" title="최근 30일 간의 오류를 버전별, 종류별로 묶어서 조회합니다.">오류별 묶음</a></li>
                <li class='menu'><img src="img/comment_new.gif" /> <a id="menu_anchor_4" title="최근 30일 간의 오류를 종류별로만 묶어서 조회합니다.">오류별 묶음 (버전 무시)</a></li>

                <!--span class='menu'><img src="img/folder.gif" /><a href="file://///yourserver/project/crash/www/reported files/">폴더 직접 열기</a></span-->

                <li class='menu lastmenu'><img src="img/icon_wand.gif" /> <a id="menu_anchor_5" title="삭제한 보고를 조회합니다.">휴지통</a></li>
        </ul>
        <div class="clear"></div>
        <h1><a href="/">크래시웹 v2.1</a></h1>
    </div>
    <div class="clear"></div>
    <div id="content">        
        <div id="report">
        </div>        
    </div>
    <div class="clear"></div>
    <div id="footer">
        <span>Copyright &copy; 2008-2011 NTREEV SOFT. All rights reserved.
        <br />Author: flow3r
        <br />Contributors: devryu, parkgh
        </span>
    </div>
    <script type="text/javascript">
        cw_SetMainView('report');
        cw_SetCallstackPreviewId('tooltip');

        // parse params (for support legacy link)
        var request = document.location.toString();
        var paramString = "";
        var pos = request.indexOf('?')
        if (pos > 0) {
            paramString = request.substring(pos + 1);
        }

        var proj = 1;
        var cuid = 0;
        var loginId = "";

        var params = paramString.split('&');
        for (var k in params) {
            var key = params[k].split('=')[0];
            var val = params[k].split('=')[1];

            if (key == "project") {
                proj = parseInt(val);
            }

            if (key == "cuid") {
                cuid = parseInt(val);
            }

            if (key == "loginid") {
                loginId = val;
            }
        }

        // load project
        cw_LoadProjectList(proj);
    </script>
    <script type="text/javascript" src="hash-urls.js?20110526001"></script>
</body>
</html>
