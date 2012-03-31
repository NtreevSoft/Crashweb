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

function create_source_link(fileline, filenameOnly) {

    return g_repo_search_pattern.replace('<keyword>', filenameOnly);
}

function create_issue_tracker_link() {

    return g_issue_tracker_info.uri;
}

function get_issue_tracker_name() {

    return g_issue_tracker_info.name;
}

// global variables
var cw_pageSize = 30;
var cw_fromDate = 30; // 30일부터
var cw_lastRand = 0; // 마지막에 요청한 ajax만 렌더링하려고. 좋은 방법은 아니지만, 동작한다. ;-)

// 맨티스 등으로 내보내기 관련 (deprecated: 다른 방식으로 교체 적용되었음)
function ReportBug(mailMessage) {
    var c = new ActiveXObject("CDO.Configuration");
    c.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpserver") = '000.000.000.000'; // ip
    c.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpserverport") = 25;
    c.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendusing") = 2;
    c.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpusessl") = 0;
    c.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate") = 0;
    c.Fields.Update();

    var msg = new ActiveXObject("CDO.Message");
    msg.BodyPart.Charset = "UTF-8";
    msg.Subject = "[크래시웹] 의견 및 버그 신고";
    msg.To = "id@email.com"; // email
    msg.From = "Anonymous";
    msg.TextBody = mailMessage;
    msg.Configuration = c;
    msg.Send();
    msg = null;
}

/*  Utility functions
 *	
 */

function cw_logging() {

    if (console && console.log) {

        // console.log.apply(this, arguments);

        var args = Array.prototype.slice.call(arguments)
        console.log(args.join(' '));
    }
}

function ISODateString(d) {
    function pad(n) { return n < 10 ? '0' + n : n }
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}

function cw_path() {

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    return args.join('/');
}

function cw_getHideResolved() {
    var hide_resolved = false;
    if ($.cookie("hide_resolved_v2") == "true") {
        hide_resolved = true;
    }

    return hide_resolved;
}

// 프로젝트 목록 읽기
function cw_LoadProjectList(cur_project)
{
    function project_list_begin() {

        var pos = $('#project #prj_select').offset();
        pos.top += $('#project #prj_select').height() + 3;

        $('#project #prj_option').css(pos);

        $('#project #prj_option')
            .stop(true)
            .css({ opacity: 1 },'fast')
            .fadeIn('fast');
    }

    function project_list_end() {
        $('#project #prj_option')
            .fadeOut('fast');
    }

    $('body').mousemove(function (e) {

        // #prj_select, #prj_option 항목의 onmousemove에서 stopPropagation하고 있으니, 이 함수가 불리면 마우스가 프로젝트 리스트 UI 외부에 있다는 뜻.
        var elem = $('#project #prj_option');
        if (elem.is(':animated') == false && elem.is(':visible')) {

            project_list_end();
        }
    });

    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#project');
    $.ajax({
        url: 'proc/ProjectList.aspx',
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("프로젝트 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {
            $('#project img').remove();

            $('<div id="prj_select"></div>').appendTo('#project');
            $('<div id="prj_option"></div>').appendTo('#project');

            $('#project #prj_select').hover(function () {
                project_list_begin();
            }, function () {
                project_list_end();
            });
            $('#project #prj_select').mousemove(function (e) {
                e.stopPropagation();
            });

            $('#project #prj_option').hover(function () {
                project_list_begin();
            }, function () {
                project_list_end();
            });
            $('#project #prj_option').mousemove(function (e) {
                e.stopPropagation();
            });

            var itemCount = 0;
            $(xml).find('Item').each(function () {
                var uid = $(this).attr("uid");
                var name = $(this).attr("name");

                if (uid == cur_project) {
                    $('#project #prj_select').html('<div class="fixed"><b>' + uid + '</b>. ' + name + ' <sub>▼</sub></div>');
                }

                $('<div />')
                    .html('<a href="?project=' + uid + '" rel="external"><b>' + uid + '</b>. ' + name + '</a>')
                    .appendTo('#project #prj_option');

                itemCount++;
            });
        }
    });
}

// 콜스택 미리보기
var cw_tooltipId = "";
var cw_CallstackPreviewList = {};
function cw_SetCallstackPreviewId(id)
{
    cw_tooltipId = id;
}
function cw_ShowCallstackPreview(callstack_uid, top, left, show_control) {

    $('#' + cw_tooltipId).empty();
    $('#' + cw_tooltipId).addClass('radius');
    $('#' + cw_tooltipId).css({ "top": top, "left": left, "opacity": "0.8" });
    if (show_control == true) {
        $('#' + cw_tooltipId).show();
    }

    var text = cw_CallstackPreviewList[callstack_uid];
    if (text != null) {
        $('#' + cw_tooltipId).html(text);
        return;
    }

    cw_CallstackPreviewList[callstack_uid] = "loading...";

    $.ajax({
        url: 'proc/CallstackPreview.aspx?callstack_uid=' + callstack_uid,
        type: 'GET',
        dataType: 'xml',
        success: function (xml) {

            var simple_callstack_view = $(xml).find('Callstack').text();
            cw_CallstackPreviewList[callstack_uid] = simple_callstack_view
                                                        .replace(/</g, '&lt;')
                                                        .replace(/>/g, '&gt;')
                                                        .replace(/(\r\n)|(\r)|(\n)/g, "<br />");
            cw_ShowCallstackPreview(callstack_uid, top, left, false);

        }
    });
}
function cw_HideCallstackPreview() {
    $('#' + cw_tooltipId).hide();
}

// 최근에 보고된 항목 조회
var cw_viewId = "";
function cw_SetMainView(id)
{
    cw_viewId = id;
}

function cw_RenderCallstackPreview(jqItem, callstack_uid) {
    jqItem.mouseover(function (e) {
        $(this).mousemove(function (e) {
            var top = e.pageY;
            var left = e.pageX + 20;

            var td = $(this).parent();
            left = td.position().left;
            top = td.position().top + td.height() + 10;

            //cw_logging("top=" + top + "left=" + left);

            cw_ShowCallstackPreview(callstack_uid, top, left, true);
        })
    });
    jqItem.mouseout(cw_HideCallstackPreview);
}

// 콜스택 코멘트 미리보기
var cw_currentCallstackCommentUID = null;

function cw_InsertCallstackComment(callstack_uid, author, comment) {

    $.ajax({
        url: 'proc/InsertCallstackComment.aspx?callstack_uid=' + callstack_uid + '&author=' + encodeURIComponent(author) + '&comment=' + encodeURIComponent(comment),
        type: 'GET',
        dataType: 'xml',
        success: function (xml) {

            var result = $(xml).find('Outputs').attr('result');
            if (result == 'True') {

                var table = $('#comment_box #comments table');
                if (table.length == 0) {
                    $('#comment_box #comments').html('<table><tr><th>작성자</th><th>코멘트</th><th>작성일</th></tr></table>');
                }

                $('<tr />')
                    .html('<td>' + author + '</td><td>' + comment + '</td><td class="smalltext">NOW</td>')
                    .appendTo('#comment_box #comments table');

                var num_comments = $('#num_comments_' + callstack_uid);
                var old_number = num_comments.text().trim();
                if (old_number.length > 0) {
                    old_number = parseInt(old_number);
                }
                else {
                    old_number = 0;
                }

                num_comments.text(old_number + 1);
            }

            $('#comment_box input#author').attr('disabled', false);
            $('#comment_box input#comment').attr('disabled', false).val('');
        }
    });
}

function cw_ShowCallstackComment(callstack_uid, top, left) {

    $('#comment_box #comment_box_close').click(function (e) {
        $(this).parent().fadeOut('fast');
    });

    $('#comment_box #comments')
        .empty()
        .html('<img src="img/loading-spinner.gif" />');

    $('#comment_box')
            .css({ "top": top, "left": left })
            .fadeIn('fast', function () {

                $('#comment_box input#comment').val('');

                if ($('#comment_box input#author').val().length > 0) {
                    $('#comment_box input#comment').focus();
                }
                else {

                    var author = $.cookie("author") || '';
                    if (author.length > 0) {
                        $('#comment_box input#author').val(author);
                        $('#comment_box input#comment').focus();
                    }
                    else {

                        $('#comment_box input#author').focus();
                    }
                }

                $(this).attr('callstack_uid', callstack_uid);
            });

    $.ajax({
        url: 'proc/CallstackComment.aspx?callstack_uid=' + callstack_uid,
        type: 'GET',
        dataType: 'xml',
        success: function (xml) {

            var items = $(xml).find('Item');
            if (items.size() > 0) {
                $('#comment_box #comments').html('<table><tr><th>작성자</th><th>코멘트</th><th>작성일</th></tr></table>');
                items.each(function () {

                    $('<tr />')
                        .html('<td>' + $(this).attr('author') + '</td><td>' + $(this).text() + '</td><td class="smalltext">' + $(this).attr('created') + '</td>')
                        .appendTo('#comment_box #comments table');
                });
            }
            else {
                $('#comment_box #comments').html('코멘트가 없습니다!');
            }

            $('#comment_box input').unbind('keydown');
            $('#comment_box input').bind('keydown', function (e) {

                if (e.which == 13) {

                    var author = $('#comment_box input#author');
                    var comment = $('#comment_box input#comment')

                    var author_val = $.trim(author.val());
                    var comment_val = $.trim(comment.val());

                    if (author_val.length > 0 && comment_val.length > 0) {

                        author.attr('disabled', true);
                        comment.attr('disabled', true);

                        $.cookie("author", author_val, { expires: 15 });

                        cw_InsertCallstackComment(callstack_uid, author_val, comment_val);
                    }
                }
                if (e.which == 27) {
                    $('#comment_box').hide();
                }
            });
        }
    });
}

function cw_RenderCallstackCommentForm(jqItem, callstack_uid) {

    jqItem.click(function (e) {

        if ($('#comment_box').is(':visible') && $('#comment_box').attr('callstack_uid') == callstack_uid) {

            $('#comment_box').hide();
            return;
        }

        var top = e.pageY;
        var left = e.pageX + 20;

        var td = $(this).parent();
        left = td.position().left;
        top = td.position().top + td.height() + 10;

        cw_ShowCallstackComment(callstack_uid, top, left);

    });
}

function cw_convert_ISO8601_to_Days_value(v, allow_minus) {

    allow_minus = allow_minus || false;

    if (v.indexOf('-') == -1) {
        return;
    }

    var old = Date.parse(v);
    var now = new Date();

    var diff = now - old; // diff in msec
    var days = Math.floor(diff / 1000 / 60 / 60 / 24);
    if (allow_minus)
        return days;

    if (days < 0)
        days = 0;

    return days;
}

function cw_convert_ISO8601_to_Days(elem) {

    var v = elem.val();
    var days = cw_convert_ISO8601_to_Days_value(v);
    if (days) {

        elem.val(days);
    }
}

function cw_convert_ISO8601_to_Days_dateinfo(dateinfo) {

    if (dateinfo == null)
        return dateinfo;

    return {
        'from': cw_convert_ISO8601_to_Days_value(dateinfo.from),
        'to'  : cw_convert_ISO8601_to_Days_value(dateinfo.to)
    }
}

function cw_call_if_valid_range(from, to, func, no_samedate) {

    var valid = false;
    no_samedate = no_samedate || false;

    var from_val = from.val();
    var to_val = to.val();

    // 1.정상적인 값인지 체크
    from_val = cw_convert_ISO8601_to_Days_value(from_val, true);
    to_val = cw_convert_ISO8601_to_Days_value(to_val, true);

    valid = (from_val >= 0) && (to_val >= 0);
    if (valid) {
        var tenYears = 365 * 10;
        var diffDays = from_val - to_val;

        if (from_val > tenYears || to_val > tenYears) {
            valid = false;
        }
    }

    // 2.앞뒤 값의 범위 체크
    if (valid) {

        if (no_samedate) {
            valid = from_val > to_val;
        }
        else {
            valid = from_val >= to_val;
        }
    }

    // 3.정상이면 콜백 함수 호출 (아니면, 에디트 창의 색을 붉은 계열 색으로 바꾸기)
    if (valid) {

        var dateinfo = {};
        dateinfo.from = from_val;
        dateinfo.to = to_val;

        func(dateinfo);
    }
    else {
        from.css('background-color', 'mistyrose');
        to.css('background-color', 'mistyrose');
    }
}


// 페이지 네비게이터 그리기
function cw_RenderPageNavigator(proj, page, size, xml, show_search, dateinfo, func) {
    var project = proj;
    var pageNo = page;
    var pageSize = size;
    var totalPageSize = parseInt($(xml).find('TotalPageSize').text());
    var prevPageNo = pageNo - 1;
    if (prevPageNo < 1)
        prevPageNo = 1;

    var nextPageNo = pageNo + 1;
    if (nextPageNo > totalPageSize)
        nextPageNo = totalPageSize;

    if (totalPageSize <= 1) {
        $('<div id=pageNavigator></div>')
            .appendTo('#' + cw_viewId);

        return;
    }

    $('<div id=pageNavigator></div>')
            .html("<form method=get><img src='img/page_code.gif' title='페이지 네비게이터' /> <input type=hidden id=project name=project value=" + project + " /><input type=hidden id=pageSize name=pageSize value=" + pageSize + " /></form>")
            .appendTo('#' + cw_viewId);

    if (prevPageNo == pageNo)
        $("#pageNavigator form").append("처음 | ");
    else
        $("#pageNavigator form").append("<a id=prev href='#'>이전</a> | ");

    $("#pageNavigator form").append("<input type=text id=pageNo name=pageNo size=1 value='" + pageNo + "' />/" + totalPageSize + " | ");

    if (nextPageNo == pageNo)
        $("#pageNavigator form").append("마지막");
    else
        $("#pageNavigator form").append("<a id=next href='#'>다음</a>");

    $('#pageNavigator form').append(" <sup>[해결됨 숨김:<input type=checkbox style='vertical-align:top;' id=hide_resolved />]</sup>");
    $('#pageNavigator #hide_resolved').attr('checked', cw_getHideResolved());

    if (show_search) {
        $('#pageNavigator form').append("<br /><img src='img/page_user.gif' title='검색' /> <input type=text id=loginid placeholder='아이디 검색' />");
        $('#pageNavigator form').append(" 또는 <input type=text id=loginip placeholder='IP 검색' />");
    }

    if (dateinfo) {
        $('#pageNavigator form').append('<br /><img src="img/tables.gif" title="기간 선택 (최대 10년)" /> <input type="text" id="fromdate" class="datepicker" />일부터 ');
        $('#pageNavigator form').append('<input type="text" id="todate" class="datepicker" />일까지');

        $('#pageNavigator .datepicker').datepicker();
        $('#pageNavigator .datepicker').datepicker("option", "dateFormat", 'yy-mm-dd');
        $('#pageNavigator input#fromdate').val(dateinfo.from);
        $('#pageNavigator input#todate').val(dateinfo.to);

        $('#pageNavigator .datepicker').change(function () {

            cw_call_if_valid_range($("#pageNavigator input#fromdate"), $("#pageNavigator input#todate"), function (dateinfo) {

                func(1, dateinfo);
            });
        });
    }

    $("#pageNavigator #prev").click(function () { func(prevPageNo, cw_convert_ISO8601_to_Days_dateinfo(dateinfo)); });
    $("#pageNavigator #next").click(function () { func(nextPageNo, cw_convert_ISO8601_to_Days_dateinfo(dateinfo)); });
    $("#pageNavigator #pageNo").keydown(function (e) {
        if (e.which == 13) {
            var pageNo = parseInt($(this).attr('value'));
            if (pageNo > totalPageSize)
                pageNo = totalPageSize;
            if (pageNo < 1)
                pageNo = 1;
            if (pageNo != page) {
                func(pageNo, cw_convert_ISO8601_to_Days_dateinfo(dateinfo));
            }
            return false;
        }
    });

    $("#pageNavigator #hide_resolved").click(function () {
        var checked = $(this).attr('checked');
        $.cookie("hide_resolved_v2", checked, { expires: 15 });

        func(page, cw_convert_ISO8601_to_Days_dateinfo(dateinfo), true);

        return true;
    });

    if (show_search) {
        $("#pageNavigator #loginid").keydown(function (e) {
            if (e.which == 13) {
                var loginId = $(this).attr('value');
                if (loginId.length > 0) {
                    var searchByLoginId = 1;
                    load('#/recent/' + cw_path(1, size, searchByLoginId, loginId));
                }
                return false;
            }
        });
        $("#pageNavigator #loginip").keydown(function (e) {
            if (e.which == 13) {
                var loginIP = $(this).attr('value');
                if (loginIP.length > 0) {
                    var searchByLoginIP = 2;
                    load('#/recent/' + cw_path(1, size, searchByLoginIP, loginIP));
                }
                return false;
            }
        });
    }

    if (dateinfo) {

        var invoker = function (e) {
            if (e.which == 13) {

                cw_call_if_valid_range($("#pageNavigator input#fromdate"), $("#pageNavigator input#todate"), function (dateinfo) {

                    func(1, dateinfo);
                });
            }
        }

        $("#pageNavigator #fromdate").keydown(invoker);
        $("#pageNavigator #todate").keydown(invoker);
    }
}

function cw_RenderEmpty(inTrash) {
    //cw_logging(inTrash);
    if (inTrash) {
        $('#' + cw_viewId).append('<p>* 휴지통이 비었습니다. ;-p</p>');
    }
    else {
        $('#' + cw_viewId).append('<p>* 보고된 오류가 없습니다.</p>');
    }
}

function cw_createInlineButton(callstack_uid, num_comments) {

    var rear = '<sup class="highlight" id="num_comments_' + callstack_uid + '"></sup>';
    if (parseInt(num_comments) > 0) {
        rear = '<sup class="highlight" id="num_comments_' + callstack_uid + '">' + num_comments + '</sup>';
    }

    return '<img class="preview" src="img/page_find.gif" /> <img class="comment" src="img/note_new.gif" title="코멘트 보기/작성하기"/>' + rear;
}

//
//  @param  preview     미리보기 활성화 여부
//  @param  inTrash     휴지통 조회 여부
//
function cw_RenderReport(xml, target, proj, size, preview, inTrash) {
    // 테이블 내용 출력
    var report_uid = $(xml).attr("report_uid");
    var login_id = $(xml).attr("login_id");
    var ipaddr = $(xml).attr("ipaddr");
    var reported_time = $(xml).attr("reported_time");
    var relative_time = $(xml).attr("relative_time");
    var callstack_uid = $(xml).attr("callstack_uid");
    var assigned = $(xml).attr("assigned");

    var version = $(xml).find('Version').text();
    var filename = $(xml).find('Filename').text();
    var funcname = $(xml).find('Funcname').text();
    funcname = funcname.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var uservoice = $(xml).find('Uservoice').text();
    uservoice = uservoice.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    var num_comments = $(xml).attr("num_comments");

    var tds = '<tr>';
    tds += '<td><a href="#/recent/' + cw_path(1, size, 1, login_id) + '">' + login_id + '</a></td>';
    tds += '<td><a href="#/recent/' + cw_path(1, size, 2, ipaddr) + '">' + ipaddr + '</a></td>';

    tds += '<td title="' + reported_time + '">' + relative_time + '</td>';

    tds += "<td class=callstack><a id='callstack_anchor_" + callstack_uid;

    if (assigned == "R") {
        tds += "' href='javascript:cw_UpdateCallstack(" + proj + "," + callstack_uid + ",\"N\");'><span class='radius4 btnize_silver resolved'>해결됨</span></a> ";
    }
    else {
        var txt = (assigned == "I") ? "재발생" : "미해결";
        var cls = (assigned == "I") ? "btnize_gold reissued" : "btnize_Coral reported";
        tds += "' href='javascript:cw_UpdateCallstack(" + proj + "," + callstack_uid + ",\"R\");'><span class='radius4 " + cls + "'>" + txt + "</span></a> ";
    }

    if (funcname.length >= 42)
        funcname = funcname.substr(0, 42) + " <b>…</b>";

    tds += '<a href="#/view/' + callstack_uid + '">' + funcname + '</a> ' + cw_createInlineButton(callstack_uid, num_comments) + '</td>';

    var uservoice_simple;
    var debugStringPos = uservoice.indexOf('Exception Record');
    if (debugStringPos >= 0)
        uservoice_simple = uservoice.substring(0, debugStringPos);
    else
        uservoice_simple = uservoice;
    if (uservoice_simple.length > 32)
        uservoice_simple = uservoice_simple.substr(0, 32) + ' <b>[…]</b>';
    tds += "<td title='" + uservoice + "'>" + uservoice_simple + "</td>";

    tds += '<td align=center><a href="#/group/' + cw_path(1, version, size) + '">' + version + '</a></td>';

    // filename => reports/00000_192.168.1.101_20100324_181547_480.zip 이런 포맷임.
    //          => 이걸 reports/[proj]/filename.zip 이런 식으로 변경
    var downloadPath = filename.replace('reports/', 'reports/' + proj + '/');

    tds += '<td><a href="' + downloadPath + '" title="원본 파일을 내려받습니다." rel="external"><img class="opacity" src="img/action_save.gif" /></a>';
    if (report_uid > 0) {
        if (inTrash) {
            tds += " | <a id='report_anchor_" + report_uid + "' href='javascript:cw_UpdateReportState(" + report_uid + ",0," + inTrash + ");' title='이 항목을 복원합니다.'><img class='opacity' src='img/page_dynamic.gif' /></a>";
        }
        else {
            tds += " | <a id='report_anchor_" + report_uid + "' href='javascript:cw_UpdateReportState(" + report_uid + ",1," + inTrash + ");' title='이 항목을 완전히 숨깁니다.'><img class='opacity' src='img/page_deny.gif' /></a>";
        }
    }
    tds += " | <a id='report_anchor_" + report_uid + "' href='javascript:cw_DeleteReport(" + proj + "," + report_uid + ",\"\"," + inTrash + ");' title='이 보고만 다시 분석하도록 예약합니다.'><img class='opacity' src='img/page_delete.gif' /></a>";
    tds += " | <a id='report_anchor_" + version + "' href='javascript:cw_DeleteReport(" + proj + "," + report_uid + ",\"" + version + "\"," + inTrash + ");' title='이 버전을 전체를 다시 분석하도록 예약합니다.'><img class='opacity' src='img/page_cross.gif' /></a>";
    tds += "</td>";
    tds += "</tr>";

    $(target).append(tds);

    // 해결 상태에 따른 클래스 적용
    var lastRow = $(target + ' tr:last');
    if (assigned == "R") {
        lastRow.addClass("grayed");
    }

    // 콜스택 프리뷰 팝업 설정
    if (preview == true) {
        var last_callstack = $(target + ' tr:last .callstack img.preview');
        cw_RenderCallstackPreview(last_callstack, callstack_uid)
    }

    var last_callstack_comment = $(target + ' tr:last .callstack img.comment');
    cw_RenderCallstackCommentForm(last_callstack_comment, callstack_uid);
}

function cw_LoadReportList(proj, page, size, filter_type, filter_value) {
    cw_HideCallstackPreview();
    $('#' + cw_viewId).empty();
    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId);

    var rand = Math.random();
    cw_lastRand = rand;
    $.ajax({
        url: 'proc/ReportList.aspx?project=' + proj + '&pageNo=' + page + '&pageSize=' + size + '&filterType=' + filter_type + '&filterValue=' + filter_value + "&hideResolved=" + cw_getHideResolved(),
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("오류 보고 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {
            if (rand != cw_lastRand)
                return;

            $('#' + cw_viewId).empty();

            // 1. 페이지 네비게이터
            cw_RenderPageNavigator(proj, page, size, xml, true, null, function (page, dateinfo, hard) {

                load('#/recent/' + cw_path(page, size, filter_type, filter_value), hard);
            });

            var items = $(xml).find('Item');
            if (items.size() > 0) {
                // 2. 테이블 내용 출력
                $('<table></table>')
                    .attr("cellspacing", "0")
                    .attr("cellpadding", "0")
                    .appendTo('#' + cw_viewId);

                // 2.1. 테이블 헤더
                var ths = "<tr><th>로그인 아이디</th><th>아이피 주소</th><th>발생 시각</th><th>발생 위치</th><th>유저 보이스</th><th>클라이언트 버전</th><th>작업</th></tr>";
                $('#' + cw_viewId + ' table').append(ths);

                // 2.2. 테이블 내용
                items.each(function () {
                    var targetId = '#' + cw_viewId + ' table';
                    cw_RenderReport(this, targetId, proj, size, true, false);
                });
            }
            else {
                cw_RenderEmpty(false);
            }
        }
    });
}

// 추이 그래프 URL 얻기
function cw_createGraphUrl(xml) {

    // analyse xml
    var series = {};
    var labels = [];

    var versions = $(xml).find('Version');
    versions.each(function (no) {

        var name = $(this).attr('name').trim();
        if (name.length == 0) {
            name = '(NoVer' + no + ')'
        }

        var get_label = (labels.length == 0);

        var items = $(this).find('Count');
        items.each(function () {

            if (series[name] == null) {
                series[name] = [];
            }

            var d = $(this).attr('date');
            var c = $(this).attr('count');

            if (get_label) {
                labels.push(d);
            }

            series[name].push(c);
        });
    });

    // setup url
    var width = 800;
    var height = 350;
    var baseUrl = 'http://chart.apis.google.com/chart?cht=lc&chxt=x,y&chs=' + width + 'x' + height + '&';

    var params = [];

    // data
    function get_upscale(series) {

        var top = 0;
        var upscale = 0;

        var key;
        for (key in series) {

            var idx;
            for (idx = 0; idx < series[key].length; idx++) {

                var value = parseInt(series[key][idx]);

                if (top < value)
                    top = value;
            }
        }

        upscale = Math.pow(10, (top + '').substr(1).length) * (1 + parseInt((top + '')[0]));

        //cw_logging('top: ', top, upscale);

        return upscale;
    }

    var upscale = get_upscale(series);

    var legend = [];
    var serialized = [];
    var key;
    for (key in series) {

        var arr = series[key];
        var idx;
        for (idx = 0; idx < arr.length; idx++) {

            arr[idx] = Math.floor(arr[idx] / upscale * 100);
        }

        legend.push(encodeURIComponent(key));
        serialized.push(arr.join(','));
    }

    params.push('chd=t:' + serialized.join('|'));

    // line colors
    var numSeries = serialized.length;
    var colors = ['DC143C', '1E90FF', 'FF1493', '32CD32', 'FF4500', 'FFA500', '3CB371', '6B8E23', '008B8B', 'FF6347', '4682B4', '0000FF', '696969', '4169E1', '000000'];

    params.push('chco=' + colors.slice(0, numSeries).join(','));

    // legend
    params.push('chdl=' + legend.join('|'));

    // axis range
    params.push('chxr=1,0,' + upscale);

    // axis label
    function prune(arr) {
        var max_arr_size = 8;
        var arr_size = arr.length;

        if (arr_size < max_arr_size)
            return arr;

        var k = max_arr_size - 2;
        var v = (arr_size - 2) / (k + 1);

        var i;
        var indices = [];
        for (i = 0; i < (k + 1); i++) {
            indices.push(Math.ceil(v * i));
        }

        var mid = [];
        for (i = 0; i < indices.length; i++) {
            mid.push(arr[indices[i]]);
        }

        var res = [arr[0]];
        res = res.concat(mid);
        res.push(arr[arr.length - 1]);

        return res;
    }

    params.push('chxl=0:|' + prune(labels).join('|'));

    // axis label style
    params.push('chxs=0,,12,-1,lt')

    // title
    //params.push('chtt=최근 60일 간의 추이 그래프 (버전별)');

    // build & return
    return baseUrl + params.join('&');
}

// 버전별, 일자별로 묶어서 그래프 그리기 (OBSOLETE)
//
function cw_LoadTrendGraph(callstack_uid, top, left) {

    $.ajax({
        url: 'proc/TrendCount.aspx?callstack_uid=' + callstack_uid,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("오류 보고 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {

            var imgUrl = cw_createGraphUrl(xml);
            //cw_logging('URL-LENGTH',imgUrl.length);

            $('<img />')
                .attr('src', imgUrl)
                .css({ 'top': top, 'left': left, 'position': 'absolute', 'display': 'block' })
                .click(function () {
                    $(this).fadeOut('fast', function () {
                        $(this).remove();
                    })
                })
                .prependTo('body');

        }
    });
}

// 종류별로 묶어서 콜스택 목록 보기
//
//  @from   언제부터 (단위: 일)
//  @to     언제까지
//  @seperate_version   버전별로 묶어서 볼 것인가 여부.
//
//  @remark
//      예1) 최근 30일간의 정보를 본다: from=30, to=0.
//
function cw_LoadCallstackList(proj, from, to, page, size, seperate_version, specific_version) {

    cw_HideCallstackPreview();
    $('#' + cw_viewId).empty();
    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId);

    var rand = Math.random();
    cw_lastRand = rand;
    $.ajax({
        url: 'proc/CallstackList.aspx?project=' + proj
                                  + '&pageNo=' + page
                                  + '&pageSize=' + size
                                  + '&from=' + from
                                  + '&to=' + to
                                  + '&sv=' + seperate_version.toString()
                                  + "&ver=" + specific_version
                                  + "&hideResolved=" + cw_getHideResolved(),
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("오류 보고 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {
            if (rand != cw_lastRand)
                return;

            $('#' + cw_viewId).empty();

            var items = $(xml).find('Item');
            if (items.size() > 0) {

                // 1. 페이지 네비게이터
                var fromdate = new Date();
                fromdate.setDate(fromdate.getDate() - from);

                var todate = new Date();
                todate.setDate(todate.getDate() - to);

                cw_RenderPageNavigator(proj, page, size, xml, false, { 'from': ISODateString(fromdate), 'to': ISODateString(todate) }, function (page, dateinfo, hard) {
                    if (seperate_version) {
                        load('#/group/' + cw_path(page, specific_version, size, dateinfo.from, dateinfo.to), hard);
                    }
                    else {
                        load('#/group_all/' + cw_path(page, size, dateinfo.from, dateinfo.to), hard);
                    }
                });

                // 2. 테이블 내용 출력
                $('<table></table>')
                    .attr("cellspacing", "0")
                    .attr("cellpadding", "0")
                    .appendTo('#' + cw_viewId);

                var targetId = '#' + cw_viewId + ' table';

                // 2.1. 테이블 헤더
                var ths = "<tr><th>최근 발생 시각</th><th>발생 위치</th><th>클라이언트 버전</th><th>발생 횟수</th></tr>";
                $(targetId).append(ths);

                // 2.2. 테이블 내용
                var sort_func = function (a, b) {

                    var aVersion = $(a).find('Version').text();
                    var bVersion = $(b).find('Version').text();

                    if (seperate_version === false || aVersion == bVersion) {

                        var aCount = parseInt($(a).attr("count"));
                        var bCount = parseInt($(b).attr("count"));

                        return bCount < aCount ? -1 : 1;
                    }

                    return bVersion < aVersion ? -1 : 1;
                };

                var verSaved = "";
                items.sort(sort_func).each(function () {
                    var count = $(this).attr("count");
                    var latest_time = $(this).attr("latest_time");
                    var relative_time = $(this).attr("relative_time");
                    var callstack_uid = $(this).attr("callstack_uid");
                    var assigned = $(this).attr("assigned");
                    var num_comments = $(this).attr("num_comments");

                    var version = $(this).find('Version').text();
                    var funcname = $(this).find('Funcname').text();
                    funcname = funcname.replace(/</g, '&lt;').replace(/>/g, '&gt;');

                    var funcname_simple = funcname;
                    if (funcname_simple.length > 64)
                        funcname_simple = funcname_simple.substr(0, 64) + " <b>…</b>";

                    if (seperate_version == true && version != verSaved) {
                        if (verSaved.length > 0) {
                            $('<tr></tr>')
                            .addClass('seps')
                            .html("<td colspan=4 style='text-align:center;font-size:0.7em;border:solid 1px gray;'>VERSION CHANGED</td>")
                            .appendTo(targetId);
                        }

                        //flipped = !flipped;
                        verSaved = version;
                    }

                    var tds = "<tr>";
                    tds += "<td title='" + latest_time + "'>" + relative_time + "</td>";

                    //tds += "<td class=callstack><a href='javascript:cw_LoadCallstackView(" + proj + "," + callstack_uid + ");'>" + funcname + "</a></td>";
                    tds += "<td class=callstack><a id='callstack_anchor_" + callstack_uid;
                    if (assigned == "R") {
                        tds += "' href='javascript:cw_UpdateCallstack(" + proj + "," + callstack_uid + ",\"N\");'><span class='radius4 btnize_silver resolved'>해결됨</span></a> ";
                    }
                    else {
                        var txt = (assigned == "I") ? "재발생" : "미해결";
                        var cls = (assigned == "I") ? "btnize_gold reissued" : "btnize_Coral reported";
                        tds += "' href='javascript:cw_UpdateCallstack(" + proj + "," + callstack_uid + ",\"R\");'><span class='radius4 " + cls + "'>" + txt + "</span></a> ";
                    }
                    tds += "<a href='#/view/" + callstack_uid + "' title='" + funcname + "'>" + funcname_simple + "</a> " + cw_createInlineButton(callstack_uid, num_comments) + "</td>";

                    tds += '<td align=center><a href="#/group/' + cw_path(1, version, size, from, to) + '">' + version + '</a></td>';
                    //tds += "<td align=left>" + "<table cellspacing=0 cellpadding=0><tr><td class='bar' width='" + count + "'>" + count + "</td></tr></table>" + "</td>";
                    tds += '<td><div class="progress">' + count + '&nbsp;</div></td>';
                    tds += "</tr>";
                    $(targetId).append(tds);

                    // 해결 상태에 따른 클래스 적용
                    var lastRow = $(targetId + ' tr:last');
                    if (assigned == "R") {
                        lastRow.addClass("grayed");
                    }

                    var lastCount = $(targetId + ' tr:last .progress');
                    var width = parseInt(count);
                    if (width < 6)
                        width = 6;

                    if (width > 512) {
                        width = 512;
                        lastCount.append('<b>…</b>&nbsp;');
                    }

                    lastCount.css({ "width": width, 'text-align': 'right' });
                    if (assigned == "R") {
                        lastCount.css({ "background-color": "silver" });
                    }
                    /*
                    lastCount.click(function (e) {

                    var top = e.pageY;
                    var left = e.pageX + 20;

                    var td = $(this).parent();
                    left = td.parent().position().left;
                    top = td.position().top + td.height() + 10;

                    cw_LoadTrendGraph(callstack_uid, top, left);
                    });
                    */

                    // 콜스택 프리뷰 팝업 설정
                    var last_callstack = $('#' + cw_viewId + ' tr:last .callstack img.preview');
                    cw_RenderCallstackPreview(last_callstack, callstack_uid);

                    var last_callstack_comment = $('#' + cw_viewId + ' tr:last .callstack img.comment');
                    cw_RenderCallstackCommentForm(last_callstack_comment, callstack_uid);
                });
            }
            else {
                cw_RenderEmpty(false);
            }
        }
    });
}

// 콜스택 상세보기
function cw_GetCopyLink(proj, cuid) {

    var location = document.location.toString();
    var pos = location.indexOf('?')
    if (pos > 0) {
        location = location.substr(0, pos);
    }

    pos = location.indexOf('#')
    if (pos > 0) {
        location = location.substr(0, pos);
    }

    var paramString = "?project=" + proj + "&cuid=" + cuid;

    return location + paramString;
}

function cw_ApplySearchLink(fileline) {

    var pos = fileline.lastIndexOf('\\');
    var rear = fileline.lastIndexOf('@');
    if (pos == -1 || rear == -1 || pos > rear)
        return fileline;

    var filenameOnly = fileline.substring(pos + 1, rear);
    var linkAppliedFilename = '<a href="' + create_source_link(fileline, filenameOnly) + '" rel="external" target="_blank">' + filenameOnly + '</a>';

    return fileline.substring(0, pos + 1) + linkAppliedFilename + fileline.substring(rear);
}

function cw_LoadCallstackView(proj, callstack_uid) {
    cw_HideCallstackPreview();
    $('#' + cw_viewId).empty();
    $('#' + cw_viewId).append('<div id="stacktrace"></div><p>&nbsp;</p><div id="trendgraph"></div><p>&nbsp;</p><div id="victims"></div>');
    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId + ' #stacktrace');
    //$('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId + ' #trendgraph');
    //$('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId + ' #victims');

    var rand = Math.random();
    cw_lastRand = rand;
    $.ajax({
        url: 'proc/CallstackView.aspx?project=' + proj + '&callstack_uid=' + callstack_uid,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("오류 보고 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {
            if (rand != cw_lastRand)
                return;

            $('#' + cw_viewId + ' #stacktrace')
                .empty()
                .append('<h2>1. 스택트레이스</h2><hr size="1">');

            $('<p id=\"permalink\"></p>')
            .html('<img src=\"img/icon_link.gif\" /> Permalink <b>::</b> <span id=\"location\"></span>')
            .appendTo('#' + cw_viewId + ' #stacktrace');

            $('#permalink #location')
            .css({ 'border': 'none', 'height': '0.9em' })
            //.attr('value', cw_GetCopyLink(proj, callstack_uid));
            .text(cw_GetCopyLink(proj, callstack_uid));

            $('#permalink')
            .css({ 'font-size': '0.9em' })
            .click(function () {
                // 클릭만 하면 선택되도록
                var loc = $(this).find('#location');
                var v = loc.get(0);

                if (document.selection) {
                    var rng = document.body.createTextRange();

                    rng.moveToElementText(v);
                    rng.select();
                }
                else {
                    var rng = document.createRange();

                    rng.setStartBefore(v);
                    rng.setEndAfter(v);

                    window.getSelection().addRange(rng);
                }
            });
            $('#permalink img').css({ 'vertical-align': 'top' });

            // flow3r 2010.08.24 <> 맨티스 등록 기능 추가
            var funcname_encoded = "";
            var callstack_encoded = "";
            $(xml).find('Singlestep').each(function () {

                var funcname = $(this).find('Funcname').text();
                funcname = funcname.replace(/</g, '&lt;').replace(/>/g, '&gt;');

                if (funcname_encoded.length == 0) {
                    funcname_encoded = encodeURIComponent(funcname);
                }

                callstack_encoded += encodeURIComponent(funcname + "\r\n");
            });

            $('<p id=\"post_mantis\"></p>')
                .html('<img src="img/export_mantis.png" /> <a rel="external" target="_blank">Report this to ' + get_issue_tracker_name() + '!</a>')
                .appendTo('#' + cw_viewId + ' #stacktrace');

            var permalink_encoded = encodeURIComponent(cw_GetCopyLink(proj, callstack_uid));

            $('#post_mantis a')
                .attr("href", create_issue_tracker_link() + "summary=" + encodeURI("[크래시웹] ") + funcname_encoded + "&description=" + callstack_encoded + "&additional_info=" + permalink_encoded);

            // 테이블 내용 출력
            $('<table></table>')
            .attr("cellspacing", "0")
            .attr("cellpadding", "0")
            .appendTo('#' + cw_viewId + ' #stacktrace');

            // 테이블 헤더
            var ths = "<tr><th>깊이</th><th>발생 위치</th><th>소스 위치</th></tr>";
            $('#' + cw_viewId + ' #stacktrace table').append(ths);

            // 테이블 내용
            var verSaved = "";
            $(xml).find('Singlestep').each(function () {
                var depth = $(this).attr("depth");
                var funcname = $(this).find('Funcname').text();
                funcname = funcname.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                var fileline = $(this).find('Fileline').text();

                var funcname_simple = funcname;
                if (funcname_simple.length > 64)
                    funcname_simple = funcname_simple.substr(0, 64) + " <b>[…]</b>";

                var tds = "<tr>";
                tds += "<td align=right>" + depth + "</td>";
                tds += "<td title='" + funcname + "'>" + funcname_simple + "</td>";
                tds += "<td>" + cw_ApplySearchLink(fileline) + "</td>";
                tds += "</tr>";
                $('#' + cw_viewId + ' #stacktrace table').append(tds);
            });
        }
    });

    $.ajax({
        url: 'proc/TrendCount.aspx?callstack_uid=' + callstack_uid,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("오류 보고 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {

            $('#' + cw_viewId + ' #trendgraph')
                .empty()
                .html('<h2>2. 최근 60일 간의 추이 그래프 (버전별)</h2><hr size="1">');

            var imgUrl = cw_createGraphUrl(xml);

            $('<img />')
                .attr('src', imgUrl)
                .appendTo('#' + cw_viewId + ' #trendgraph');

            /*
            var colors = ['DC143C', '1E90FF', 'FF1493', '32CD32', 'FF4500', 'FFA500', '3CB371', '6B8E23', '008B8B', 'FF6347', '4682B4', '0000FF', '696969', '4169E1', '000000'];
            for (var i = 0; i < colors.length; ++i) {
                $('<span />')
                    .css({ 'background-color': '#' +colors[i], 'padding': '3px' })
                    .text(colors[i])
                    .appendTo('#' + cw_viewId + ' #trendgraph');
            }
            */
        }
    });

    $.ajax({
        url: 'proc/SameReportList.aspx?project=' + proj + '&callstack_uid=' + callstack_uid,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("오류 보고 목록을 읽을 수 없습니다.");
        },
        success: function (xml) {
            $('#' + cw_viewId + ' #victims')
                .empty()
                .html('<h2>3. 같은 종류의 오류 보고 목록 (최대 100개)</h2><hr size="1">');


            var items = $(xml).find('Item');
            if (items.size() > 0) {
                // 테이블 내용 출력
                $('<table></table>')
                    .attr("cellspacing", "0")
                    .attr("cellpadding", "0")
                    .appendTo('#' + cw_viewId + ' #victims');

                // 테이블 헤더
                var ths = "<tr><th>로그인 아이디</th><th>아이피 주소</th><th>발생 시각</th><th>발생 위치</th><th>유저 보이스</th><th>클라이언트 버전</th><th>작업</th></tr>";
                $('#' + cw_viewId + ' #victims table').append(ths);

                // 테이블 내용
                items.each(function () {
                    var targetId = '#' + cw_viewId + ' #victims  table';
                    cw_RenderReport(this, targetId, proj, cw_pageSize, false, false);
                });
            }
        }
    });
}

// 콜스택 상태 갱신
// N:새로 등록
// I:무시
// R:해결
// W:처리 중
function cw_UpdateCallstack(proj, callstack_uid, state) {

    var spans = $('#' + cw_viewId + ' #callstack_anchor_' + callstack_uid + ' span');
    var anchors = spans.parent();
    var tds = anchors.parent().parent();

    tds.animate({ "opacity": "0.3" }, 300);
    spans.removeClass().empty();
    spans.addClass('radius4');
    spans.html("<img src='img/loading-spinner.gif' />")

    $.ajax({
        url: 'proc/UpdateCallstackState.aspx?project=' + proj + '&callstack_uid=' + callstack_uid + '&state=' + state,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("상태를 갱신할 수 없습니다.");
        },
        success: function (xml) {

            tds.animate({ "opacity": "1" }, 300);

            if (state == "R") {

                spans.removeClass('reported').addClass('resolved').addClass('btnize_silver').text('해결됨');
                anchors.attr('href', "javascript:cw_UpdateCallstack(" + proj + "," + callstack_uid + ",\"N\")");

                tds.addClass('grayed');
                tds.find('.progress').css({ "background-color": "silver" });
            }
            else {
                spans.removeClass('resolved').addClass('reported').addClass('btnize_Coral').text('미해결');
                anchors.attr('href', "javascript:cw_UpdateCallstack(" + proj + "," + callstack_uid + ",\"R\")");

                tds.removeClass();
                tds.find('.progress').css({ "background-color": "Coral" });
            }
        }
    });
}

// 레포트 휴지통에 버리기
function cw_UpdateReportState(report_uid, state, inTrash) {
    var td = $('#' + cw_viewId + ' #report_anchor_' + report_uid).parent().parent();
    td.animate({ "opacity": "0.3" }, 300);

    $.ajax({
        url: 'proc/UpdateReportState.aspx?report_uid=' + report_uid + '&state=' + state,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("상태를 갱신할 수 없습니다.");
        },
        success: function (xml) {
            var table = $('#' + cw_viewId + ' table:last');

            td.animate({ 'opacity': '0' }, 300, function () {
                td.remove();

                var is_empty_table = table.find('tr').size() == 1; // 1개 남았다는 건 헤더 빼고 다 없어졌다는 뜻.
                if (is_empty_table === true) {

                    table.animate({ 'opacity': '0' }, 500, function () {
                        table.remove();
                        cw_RenderEmpty(inTrash);
                    });
                }
            });
        }
    });
}

// 버려진 리포트 목록 조회
function cw_LoadReportDeleted(proj) {

    $('#' + cw_viewId).empty();
    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId);

    var rand = Math.random();
    cw_lastRand = rand;
    $.ajax({
        url: 'proc/ReportDeleted.aspx?project=' + proj,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("삭제된 리포트 목록을 가져올 수 없습니다.");
        },
        success: function (xml) {
            if (rand != cw_lastRand)
                return;

            $('#' + cw_viewId).empty();

            var items = $(xml).find('Items').find('Item');
            if (items.size() > 0) {
                // 테이블 내용 출력
                $('<table></table>')
                .attr("cellspacing", "0")
                .attr("cellpadding", "0")
                .appendTo('#' + cw_viewId);

                // 테이블 헤더
                var ths = "<tr><th>로그인 아이디</th><th>아이피 주소</th><th>발생 시각</th><th>발생 위치</th><th>유저 보이스</th><th>클라이언트 버전</th><th>작업</th></tr>";
                $('#' + cw_viewId + ' table').append(ths);

                // 테이블 내용
                items.each(function () {
                    var targetId = '#' + cw_viewId + ' table';
                    cw_RenderReport(this, targetId, proj, cw_pageSize, true, true);
                });
            }
            else {
                cw_RenderEmpty(true);
            }
        }
    });
}

// 그래프
function cw_RenderGraphController(dateinfo) {

    $('<div id=graphController></div>')
        .appendTo('#' + cw_viewId);

    $('#graphController').append('<br /><img src="img/tables.gif" title="기간 선택 (최대 10년)" /> <input type="text" id="fromdate" class="datepicker" />일부터 ');
    $('#graphController').append('<input type="text" id="todate" class="datepicker" />일까지<p>&nbsp;</p>');

    $('#graphController .datepicker').datepicker();
    $('#graphController .datepicker').datepicker("option", "dateFormat", 'yy-mm-dd');
    $('#graphController input#fromdate').val(dateinfo.from);
    $('#graphController input#todate').val(dateinfo.to);

    var refresh_graph = function () {

        cw_call_if_valid_range($("#graphController input#fromdate"), $("#graphController input#todate"), function (dateinfo) {

            load('#/graph/' + cw_path(dateinfo.from, dateinfo.to));

        }, true);
    };

    var invoker = function (e) {
        if (e.which == 13) {
            refresh_graph();
        }
    };

    $("#graphController input#fromdate").keydown(invoker);
    $("#graphController input#todate").keydown(invoker);
    $('#graphController .datepicker').change(function () {

        refresh_graph();
    });
}

// SVG + VML chart
function cw_LoadDailyCountGraph_v2(proj, from, to) {

    $('#' + cw_viewId).empty();
    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId);

    var rand = Math.random();
    cw_lastRand = rand;
    $.ajax({
        url: 'proc/DailyCount.aspx?project=' + proj
                                + '&from=' + from
                                + '&to=' + to,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("그래프를 로딩할 수 없습니다.");
        },
        success: function (xml) {
            if (rand != cw_lastRand)
                return;

            $('#' + cw_viewId).empty();

            // 1. 그래프 기간 설정 컨트롤 그리기
            var fromdate = new Date();
            fromdate.setDate(fromdate.getDate() - from);

            var todate = new Date();
            todate.setDate(todate.getDate() - to);

            cw_RenderGraphController({ 'from': ISODateString(fromdate), 'to': ISODateString(todate) });

            // 2.1. 그래프 그릴 공간 생성
            $('<div />')
                    .attr('id', 'visualization')
                    .appendTo('#' + cw_viewId);

            //2.2. 그래프 그리기
            var items = $(xml).find('Counts').find('Count');

            function drawChart() {

                var data = new google.visualization.DataTable();
                data.addColumn('string', '날짜');
                data.addColumn('number', '보고 횟수');

                data.addRows(items.size());

                var sort_func = function (a, b) {
                    var aDate = $(a).attr("date");
                    var bDate = $(b).attr("date");

                    return aDate < bDate ? -1 : 1;
                };

                var sorted = items.sort(sort_func);

                sorted.each(function (n) {

                    var date = $(this).attr("date");
                    var count = parseInt($(this).attr("count"));

                    data.setValue(n, 0, date);
                    data.setValue(n, 1, count);
                });

                var chart = new google.visualization.LineChart(document.getElementById('visualization'));
                chart.draw(data,
                {
                    width: 1024,
                    height: 400,
                    legend: 'none',
                    colors: ['Coral'],
                    titleTextStyle: { fontSize: 20 },
                    title: "일별 보고 횟수 추이 (" + from + "일 전부터 " + (to ? to + '일 전' : '오늘') + "까지)"
                });

                google.visualization.events.addListener(chart, 'select', function () {

                    var sel = chart.getSelection()[0];
                    var index = sel.row;

                    var date = $(sorted[sel.row]).attr('date');
                    var days = cw_convert_ISO8601_to_Days_value(date);
                    if (days >= 0) {

                        load('#/group/' + cw_path(1, '', cw_pageSize, days, days));
                    }
                });
            }

            if (items.size() > 0) {

                drawChart();
            }
        }
    });
}

// image chart
function cw_LoadDailyCountGraph(proj, from, to) {

    $('#' + cw_viewId).empty();
    $('<img />').attr("src", "img/loading-spinner.gif").appendTo('#' + cw_viewId);

    var rand = Math.random();
    cw_lastRand = rand;
    $.ajax({
        url: 'proc/DailyCount.aspx?project=' + proj
                                + '&from=' + from
                                + '&to=' + to,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("그래프를 로딩할 수 없습니다.");
        },
        success: function (xml) {
            if (rand != cw_lastRand)
                return;

            $('#' + cw_viewId).empty();

            cw_RenderGraphController({'from':from, 'to':to});

            var items = $(xml).find('Counts').find('Count');
            if (items.size() > 0) {

                // 참고 문서: http://code.google.com/intl/ko-KR/apis/charttools/index.html

                var ch_size = "&chs=800x350";
                var ch_data = "&chd=t:";
                var ch_x_label = "&chxl=0:";
                var ch_y_label = "";
                var ch_marker = "&chm="; // "&chm=N,808080,0,-1,12,,h::14";
                var ch_style = "&chxs=0,,12,-1,lt";
                //var ch_text_title = "&chtt=일별 보고 횟수 추이 (" + from + "일 전부터 " + (to ? to + '일 전' : '오늘') + "까지)";
                var chxr = "&chxr=1,0,";

                var debug_multiplier = 1;

                var index = 0;
                var sort_func = function (a, b) {
                    var aDate = $(a).attr("date");
                    var bDate = $(b).attr("date");

                    return aDate < bDate ? -1 : 1;
                };

                var maxCount = 0;
                items.each(function () {
                    var value = parseInt($(this).attr("count"), 10) * debug_multiplier;
                    if (maxCount < value)
                        maxCount = value;
                });

                var maxCeiling = 100;
                while (maxCeiling < maxCount) {
                    maxCeiling = maxCeiling + 100;
                }
                chxr = chxr + maxCeiling; +"," + maxCeiling / 10;

                var break_num = 1;
                var num_labels = 6;
                if (items.size() > num_labels) {
                    break_num = Math.ceil(items.size() / num_labels);
                }
                items.sort(sort_func).each(function () {
                    var count = $(this).attr("count");
                    var date = $(this).attr("date");

                    if (index % break_num == 0 || (index + 1) == items.size()) {
                        ch_x_label += "|" + date;
                    }
                    index += 1;

                    var myValue = (count * debug_multiplier);
                    var percent = Math.floor(myValue * 100 / maxCeiling);

                    ch_data += percent + ",";
                    ch_marker += "t" + myValue + ",,0," + (index - 1) + ",11,,h::14|";
                });
                var lastComma = ch_data.lastIndexOf(',');
                if (lastComma > 0) {
                    ch_data = ch_data.substring(0, lastComma);
                }
                var lastBar = ch_marker.lastIndexOf('|');
                if (lastBar > 0) {
                    ch_marker = ch_marker.substring(0, lastBar);
                }
                //ch_x_label += "(오늘)";

                var targetId = '#' + cw_viewId + '';
                var graphUrl = 'http://chart.apis.google.com/chart?cht=lc&chxt=x,y' + /*ch_text_title +*/ ch_size + ch_data + ch_x_label + ch_y_label + ch_marker + ch_style + chxr;
                //cw_logging(graphUrl);

                $('<h2 />')
                    .text("일별 보고 횟수 추이 (" + from + "일 전부터 " + (to ? to + '일 전' : '오늘') + "까지)")
                    .appendTo(targetId);

                $('<img />')
                    .attr('src', graphUrl)
                    .appendTo(targetId);
            }
            else {
                cw_RenderEmpty(false);
            }
        }
    });
}

// 다시 분석 요청하기
function cw_DeleteReport(proj, report_uid, version, inTrash) {

    var td1 = $('#' + cw_viewId + ' #report_anchor_' + report_uid).parent().parent();
    var td2 = null;
    if (version != null && version.length > 0) {
        td2 = $('#' + cw_viewId + ' #report_anchor_' + version).parent().parent();
    }

    td1.animate({ "opacity": "0.3" }, 300);
    td2 && td2.animate({ "opacity": "0.3" }, 300);

    $.ajax({
        url: 'proc/ReportReserveReparse.aspx?report_uid=' + report_uid + '&version=' + version,
        type: 'GET',
        dataType: 'xml',
        error: function () {
            cw_logging("상태를 갱신할 수 없습니다.");
        },
        success: function (xml) {
            var table = $('#' + cw_viewId + ' table:last');

            td1.animate({ 'opacity': '0' }, 300, function () {
                td1.remove();

                var is_empty_table = table.find('tr').size() == 1; // 1개 남았다는 건 헤더 빼고 다 없어졌다는 뜻.
                if (is_empty_table) {

                    table.animate({ 'opacity': '0' }, 500, function () {
                        table.remove();
                        cw_RenderEmpty(inTrash);
                    });
                }
            });

            td2 && td2.animate({ 'opacity': '0' }, 300, function () {
                td2.remove();

                var is_empty_table = table.find('tr').size() == 1; // 1개 남았다는 건 헤더 빼고 다 없어졌다는 뜻.
                if (is_empty_table) {

                    table.animate({ 'opacity': '0' }, 500, function () {
                        table.remove();
                        cw_RenderEmpty(inTrash);
                    });
                }
            });
        }
    });
}
