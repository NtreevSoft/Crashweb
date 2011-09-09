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

// load
var load_startpage = function () {

    if (cuid > 0) {
        cw_LoadCallstackView(proj, cuid);
    }
    else if (loginId.length > 0) {
        cw_LoadReportList(proj, 1, cw_pageSize, 1, loginId);
    }
    else {
        //cw_LoadReportList(proj, 1, cw_pageSize, 0, '');
        cw_LoadCallstackList(proj, cw_fromDate, 0, 1, cw_pageSize, true, '');
    }
}

// support browser's history
var menufunc = {};
function menu_bind(name, func, elem) {
    menufunc[name] = { 'func': func, 'elem': elem };
}
function menu_build(anchor, name, func) {
    var elem = $(anchor);
    
    elem.attr('href', '#' + name);
    menu_bind(name, func, elem);
}

// call actual func
function dispatcher(hash) {

    if (hash == "") {
        load_startpage();
        return;
    }

    var params = hash.split('/');
    url = '/' + params[1];
    arg = params.slice(2);

    try {

        $('#menu a').removeClass('selected');

        menufunc[url].func.apply(this, arg);
        if (menufunc[url].elem) {
            menufunc[url].elem.addClass('selected');

            $('title').text(menufunc[url].elem.text() + ' - 크래시웹 v2.1');
        }
    }
    catch (e) {
        console.log('.history.fail:', hash, ', Reason:', e.message);
    }
}

// load page
function load(hash, hard) {

    hard = hard || false;
    hash = hash.substr(1);

    if (hard === false) {
        $.history.load(hash);
        return;
    }

    dispatcher(hash);
}

// document.ready

jQuery(document).ready(function ($) {

    // bind top menu items
    menu_build('#menu_anchor_1', '/graph', function (from, to) {

        from = parseInt(from);
        if (isNaN(from) || from < 0) {
            from = cw_fromDate;
        }
        to = parseInt(to) || 0;

        cw_LoadDailyCountGraph_v2(proj, from, to);
    });
    menu_build('#menu_anchor_2', '/recent', function (page, pageSize, filter_type, filter_val) {

        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize);
        if (isNaN(pageSize) || pageSize < 0) {
            pageSize = cw_pageSize;
        }
        filter_type = parseInt(filter_type) || 0;
        filter_val = filter_val || '';

        cw_LoadReportList(proj, page, pageSize, filter_type, filter_val);
    });
    menu_build('#menu_anchor_3', '/group', function (page, version, pageSize, from, to) {

        page = parseInt(page) || 1;
        version = version || '';
        pageSize = parseInt(pageSize);
        if (isNaN(pageSize) || pageSize < 0) {
            pageSize = cw_pageSize;
        }
        from = parseInt(from);
        if (isNaN(from) || from < 0) {
            from = cw_fromDate;
        }
        to = parseInt(to) || 0;

        cw_LoadCallstackList(proj, from, to, page, pageSize, true, version);
    });
    menu_build('#menu_anchor_4', '/group_all', function (page, pageSize, from, to) {

        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize);
        if (isNaN(pageSize) || pageSize < 0) {
            pageSize = cw_pageSize;
        }
        from = parseInt(from);
        if (isNaN(from) || from < 0) {
            from = cw_fromDate;
        }
        to = parseInt(to) || 0;

        cw_LoadCallstackList(proj, from, to, page, pageSize, false, '');
    });
    menu_build('#menu_anchor_5', '/trash', function () {

        cw_LoadReportDeleted(proj);
    });

    // bind for internal link
    menu_bind('/view', function (callstack_uid) {
        cw_LoadCallstackView(proj, callstack_uid);
    });

    // jquery.history 플러그인 메인
    $.history.init(dispatcher, { unescape: "/" });

    // #content의 모든 internal anchor에 대해 히스토리를 추적하기
    $('#content a').live('click', function (e) {

        var target = $(this).attr('rel');
        if (target == 'external')
            return true;

        var url = $(this).attr('href');
        var hash = url.replace(/^.*#/, '');

        $('#comment_box').hide();

        if (hash.indexOf('javascript:') == 0) {
            eval(hash);
            return false;
        }

        if (hash.length > 0) {
            $.history.load(hash);
        }
        return false;
    });

});
