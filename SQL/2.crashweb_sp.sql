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

-----------------------------------------------------------------------------------------------------------------------
-- ���ν��� ����

USE CRASHWEB_DB
GO

-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-13
-- Description:	���ο� ����Ʈ ������ ����Ѵ�.

-- Update: 2010-05-10 <> ���ϸ� �����ڵ�� �ϰ�, �ִ� ���̵� 260���� Ȯ��
-- =============================================
IF OBJECT_ID(N'dbo.usp_insert_report_file', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_insert_report_file
END
GO
CREATE PROCEDURE dbo.usp_insert_report_file 
	-- Add the parameters for the stored procedure here
	@filename nvarchar(260) 
,	@report_uid	int	output
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	SET @report_uid = 0

	IF NOT EXISTS (SELECT [filename] FROM tbl_reported_files WHERE [filename] = @filename)
	BEGIN
		INSERT INTO tbl_reported_files VALUES(@filename, getdate())
		--SET @report_uid = SCOPE_IDENTITY()
	END
	
	SELECT @report_uid = [report_uid] FROM tbl_reported_files WHERE [filename] = @filename

	-- �м� ���ο� ���� ����� ����
	IF EXISTS (SELECT * FROM tbl_report WHERE report_uid = @report_uid)
	BEGIN
		-- �̹� �м��Ϸ�� ������.
		RETURN 100;
	END

	RETURN 0;
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-17
-- Description:	���ο� �ݽ��� �α׸� ����Ѵ�.

-- Update: 2010-05-10 <> project-uid �߰� �� �������� ���� ���� ����.
-- =============================================
IF OBJECT_ID(N'dbo.usp_insert_callstack', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_insert_callstack
END
GO
CREATE PROCEDURE dbo.usp_insert_callstack
	-- Add the parameters for the stored procedure here
	@project_uid	int
,	@signature		binary(16)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	DECLARE @callstack_uid	int
		,	@error			int

	SELECT @callstack_uid = [callstack_uid]
	FROM tbl_callstack
	WHERE project_uid = @project_uid and [signature] = @signature
	
	-- 1. ����� �� �� �ݽ����̸� ���� ��� (��, ���δ�Ʈ�� �����Ͽ��� ��)
	IF @callstack_uid is null
	BEGIN
		INSERT INTO tbl_callstack VALUES(null, @project_uid, @signature, 'N', 0)
		IF @@error <> 0
		BEGIN
			SET @callstack_uid = 0
		END
		ELSE
		BEGIN
			SET @callstack_uid = SCOPE_IDENTITY()
		END
	END

	RETURN @callstack_uid
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-10
-- Description:	�ݽ��� �� ���� ����Ѵ�. usp_insert_callstack ���ν������� �и���.
-- =============================================
IF OBJECT_ID(N'dbo.usp_insert_singlestep', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_insert_singlestep
END
GO
CREATE PROCEDURE dbo.usp_insert_singlestep
	-- Add the parameters for the stored procedure here
	@callstack_uid	int
,	@depth			int
,	@funcname		nvarchar(260)
,	@fileline		nvarchar(260)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	-- 1. �ݽ����� �� �ܰ� ������Ʈ
	IF @callstack_uid <> 0 
	BEGIN
		IF NOT EXISTS (SELECT [callstack_uid] FROM tbl_singlestep WHERE [callstack_uid] = @callstack_uid and [depth] = @depth)
		BEGIN
			INSERT INTO tbl_singlestep VALUES(@callstack_uid, @depth, @funcname, @fileline)
		END
	END
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-13
-- Description:	����Ʈ ���� ������ ����Ѵ�.
-- =============================================
IF OBJECT_ID(N'dbo.usp_insert_report_info', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_insert_report_info
END
GO
CREATE PROCEDURE dbo.usp_insert_report_info
	-- Add the parameters for the stored procedure here
	@report_uid	int
,	@acnt_uid	int
,	@login_id	nvarchar(50)
,	@user_uid	int
,	@nickname	nvarchar(50)
,	@ipaddr		nvarchar(50)
,	@datetime	datetime
,	@version	nvarchar(50)
,	@callstack_uid	int
,	@uservoice	nvarchar(260)
with execute as 'dbo'
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	DECLARE @error int
		,	@lastWarned		smalldatetime
		,	@minElapsed		int
		,	@reportUidBound int
		,	@withinMin30CNT int
		,	@withinMin10CNT int
		,	@withinMin05CNT int
		,	@totalReportCNT	int
		,   @bodyText		varchar(256)

	SET @error = 0

	IF NOT EXISTS (SELECT [report_uid] FROM tbl_report WHERE [report_uid] = @report_uid)
	BEGIN
		INSERT INTO tbl_report
		VALUES(@report_uid, @acnt_uid, @login_id, @user_uid, @nickname, @ipaddr, @datetime, @version, @callstack_uid, @uservoice, 0)

		IF @@error <> 0
		BEGIN
			SET @error = 101
		END
		ELSE
		BEGIN
			-- 'N' : ���� ���(NEW)
			-- 'I' : ����(ISSUED)
			-- 'R' : �ذ�(RESOLVED)
			
			-- �ذ��� �� �ǵ�, �ٽ� ��ϵǾ����� ���� ǥ��.
			UPDATE tbl_callstack
			SET assign_state = 'I'
			WHERE callstack_uid = @callstack_uid and assign_state = 'R'
			
			-- email alarming
			-- ���������� ����� ��, 30���� ���� ��쿡 ���� Ŭ����
			SELECT @lastWarned = warned
			FROM tbl_callstack
			WHERE callstack_uid = @callstack_uid

			SET @minElapsed = datediff(mi, @lastWarned, getdate())
			IF (@minElapsed > 30)
			BEGIN
				UPDATE tbl_callstack
				SET warned = null
				WHERE callstack_uid = @callstack_uid;

				SET @lastWarned = null
			END

			IF @lastWarned is null
			BEGIN
				-- ��� ���� �˻� �Ŀ�, ������ �����ϸ� ��� ���� �߼�
				SELECT @reportUidBound = (MAX(report_uid) - 100) FROM tbl_report;

				SELECT @withinMin30CNT = COUNT(*)
				FROM tbl_report
				WHERE report_uid > @reportUidBound
				 and callstack_uid = @callstack_uid
				 and datediff(mi,[date],getdate()) <= 30;

				SELECT @withinMin10CNT = COUNT(*)
				FROM tbl_report
				WHERE report_uid > @reportUidBound
				 and callstack_uid = @callstack_uid
				 and datediff(mi,[date],getdate()) <= 10;

				SELECT @withinMin05CNT = COUNT(*)
				FROM tbl_report
				WHERE report_uid > @reportUidBound
				 and callstack_uid = @callstack_uid
				 and datediff(mi,[date],getdate()) <= 5;

				SELECT @totalReportCNT = COUNT(*)
				FROM tbl_report	
				WHERE callstack_uid = @callstack_uid
				
				/*
				IF @callstack_uid = 0x00
				BEGIN
					-- callstack-uid ���� 0�� ��(�ݽ����� ���� �α�)�� steady flood ��� ���� ����
					SET @totalReportCNT = 0;
				END
				*/

				IF 1=2 and (@withinMin30CNT >= 10 or @withinMin10CNT >= 3 or @withinMin05CNT >= 3 or @totalReportCNT > 10)
				--IF (@withinMin30CNT >= 1 or @withinMin10CNT >= 1 or @withinMin05CNT >= 1)
				BEGIN
					SET @bodyText = '�α� �ٷΰ���: http://yourserver/?project=1&cuid=';

					SET @bodyText = @bodyText + CAST(@callstack_uid AS varchar(10))
					IF @totalReportCNT > 10
					BEGIN
						SET @bodyText = '[S] ' + @bodyText;
					END

					UPDATE tbl_callstack
					SET warned = getdate()
					WHERE callstack_uid = @callstack_uid;
				END
			END			
		END
	END
	ELSE
	BEGIN
		SET @error = 102
	END

	RETURN @error
END

-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-14
-- Description:	�ֱٿ� �߻��� ���� ��� 30��.

-- Update: 2010-05-17 <> ����¡ ��� �߰�
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_recent_reports', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_recent_reports
END
GO
CREATE PROCEDURE dbo.usp_select_recent_reports
	@project_uid	int
,	@where		int	-- 0:����, 1:���̵�, 2:������
,	@filter		nvarchar(100)
,	@pageNumber	int
,	@cntPerPage	int = 30
,	@hideResolved bit = 1
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	--SET ROWCOUNT @cntPerPage;
	
	SET @filter = ('%' + @filter + '%');
	
	DECLARE @numItems int;
	DECLARE @hideResolvedChar char(1);
	
	SET @hideResolvedChar = ''
	IF @hideResolved = 1
	BEGIN
		SET @hideResolvedChar = 'R'
	END

	IF @where = 1 -- ���̵�� ����
	BEGIN
		WITH VW_General AS
		(
			SELECT ROW_NUMBER() OVER (ORDER BY A.date DESC) 'Num', A.report_uid, A.login_id, A.ipaddr, A.date, D.callstack_uid, C.funcname, A.version, B.filename, D.assign_state, A.uservoice, (SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
			FROM tbl_report A
			INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
			INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
			INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid and D.assign_state <> @hideResolvedChar
			WHERE D.project_uid = @project_uid
			 AND A.login_id like @filter
			 AND A.deleted <> 1
			--ORDER BY A.date DESC
		)
		SELECT report_uid, login_id, ipaddr, date, callstack_uid, funcname, version, filename, assign_state, uservoice, NumComments
		FROM VW_General
		WHERE Num BETWEEN (@pageNumber-1) * @cntPerPage + 1 AND @pageNumber * @cntPerPage;
		
		WITH VW_Count AS
		(
			SELECT A.[report_uid]
			FROM tbl_report A
			INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
			INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
			INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid and D.assign_state <> @hideResolvedChar
			WHERE D.project_uid = @project_uid
			 AND A.login_id = @filter
			 AND A.deleted <> 1
		)
		SELECT @numItems = COUNT(*)
		FROM VW_Count;
	END
	ELSE
	IF @where = 2
	BEGIN
		WITH VW_General AS
		(
			SELECT ROW_NUMBER() OVER (ORDER BY A.date DESC) 'Num', A.report_uid, A.login_id, A.ipaddr, A.date, D.callstack_uid, C.funcname, A.version, B.filename, D.assign_state, A.uservoice, (SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
			FROM tbl_report A
			INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
			INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
			INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid and D.assign_state <> @hideResolvedChar
			WHERE D.project_uid = @project_uid
			 AND A.ipaddr like @filter
			 AND A.deleted <> 1
			--ORDER BY A.date DESC
		)
		SELECT report_uid, login_id, ipaddr, date, callstack_uid, funcname, version, filename, assign_state, uservoice, NumComments
		FROM VW_General
		WHERE Num BETWEEN (@pageNumber-1) * @cntPerPage + 1 AND @pageNumber * @cntPerPage;
		
		WITH VW_Count AS
		(
			SELECT A.[report_uid]
			FROM tbl_report A
			INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
			INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
			INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid and D.assign_state <> @hideResolvedChar
			WHERE D.project_uid = @project_uid
			 AND A.ipaddr like @filter
			 AND A.deleted <> 1
		)
		SELECT @numItems = COUNT(*)
		FROM VW_Count;
	END
	ELSE
	BEGIN
		WITH VW_General AS
		(
			SELECT ROW_NUMBER() OVER (ORDER BY A.date DESC) 'Num', A.report_uid, A.login_id, A.ipaddr, A.date, D.callstack_uid, C.funcname, A.version, B.filename, D.assign_state, A.uservoice, (SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
			FROM tbl_report A
			INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
			INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
			INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid and D.assign_state <> @hideResolvedChar
			WHERE D.project_uid = @project_uid
			 AND A.deleted <> 1
			--ORDER BY A.date DESC
		)
		SELECT report_uid, login_id, ipaddr, date, callstack_uid, funcname, version, filename, assign_state, uservoice, NumComments
		FROM VW_General
		WHERE Num BETWEEN (@pageNumber-1) * @cntPerPage + 1 AND @pageNumber * @cntPerPage;
		
		WITH VW_Count AS
		(
			SELECT A.[report_uid]
			FROM tbl_report A
			INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
			INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
			INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid and D.assign_state <> @hideResolvedChar
			WHERE D.project_uid = @project_uid
			 AND A.deleted <> 1
		)
		SELECT @numItems = COUNT(*)
		FROM VW_Count;
	END
	
	return @numItems
END
GO

-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-14
-- Description:	�ֱ� ���� ������ȣ ��ȸ.
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_recent_report_groups', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_recent_report_groups
END
GO
CREATE PROCEDURE dbo.usp_select_recent_report_groups
	-- Add the parameters for the stored procedure here
	@project_uid	int
,	@day_from	smallint
,	@day_to		smallint
,	@specific_version nvarchar(50) = null
,	@pageNumber	int
,	@cntPerPage	int = 30
,	@hideResolved bit = 1
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	--SET ROWCOUNT @cntPerPage;

	DECLARE @today		datetime
		,	@numItems	int;

	DECLARE @hideResolvedChar char(1);
	
	SET @hideResolvedChar = ''
	IF @hideResolved = 1
	BEGIN
		SET @hideResolvedChar = 'R'
	END

	SET @today = CONVERT(varchar(10),GETDATE(), 120);

	WITH VW_General AS
	(
		SELECT ROW_NUMBER() OVER (ORDER BY A.[version] DESC, COUNT(*) DESC) 'Num', COUNT(*) 'Count', A.[callstack_uid], C.[funcname], A.[version], MAX(A.[date]) 'Latest', D.assign_state,	(SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
		FROM tbl_report A
		INNER JOIN tbl_singlestep C
		 on A.callstack_uid = C.callstack_uid
		  and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
		INNER JOIN tbl_callstack D
		 on A.callstack_uid = D.callstack_uid
		  and D.assign_state <> @hideResolvedChar
		WHERE D.project_uid = @project_uid
		 AND A.[date] >= dateadd(day, -@day_from, @today)
		 AND A.[date] <= dateadd(day, 1-@day_to, @today)
		 AND A.deleted <> 1
		 AND (@specific_version is null OR A.[version] = @specific_version)
		GROUP BY A.[callstack_uid],A.[version],C.[funcname],D.assign_state
		--ORDER BY A.[version] desc, [Count] DESC
	)
	SELECT [Count],[callstack_uid],[funcname],[version],[Latest],[assign_state], NumComments
	FROM VW_General
	WHERE Num BETWEEN (@pageNumber-1) * @cntPerPage + 1 AND @pageNumber * @cntPerPage;

	WITH VW_Count AS
	(
		SELECT A.[callstack_uid]
		FROM tbl_report A
		INNER JOIN tbl_singlestep C
		 on A.callstack_uid = C.callstack_uid
		  and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
		INNER JOIN tbl_callstack D
		 on A.callstack_uid = D.callstack_uid
		  and D.assign_state <> @hideResolvedChar
		WHERE D.project_uid = @project_uid
		 AND A.[date] >= dateadd(day, -@day_from, @today)
		 AND A.[date] <= dateadd(day, 1-@day_to, @today)
		 AND A.deleted <> 1
		 AND (@specific_version is null OR A.[version] = @specific_version)
		GROUP BY A.[callstack_uid],A.[version],C.[funcname]
	)
	SELECT @numItems = COUNT(*)
	FROM VW_Count;
	
	return @numItems
END
GO

-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-14
-- Description:	�ֱ� ���� ������ȣ ��ȸ(���� ���� ����).
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_recent_report_groups_only', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_recent_report_groups_only
END
GO
CREATE PROCEDURE dbo.usp_select_recent_report_groups_only
	-- Add the parameters for the stored procedure here
	@project_uid	int
,	@day_from	smallint
,	@day_to		smallint
,	@pageNumber	int
,	@cntPerPage	int = 30
,	@hideResolved bit = 1
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	--SET ROWCOUNT @cntPerPage;

	DECLARE @today	datetime
		,	@numItems	int;

	DECLARE @hideResolvedChar char(1);
	
	SET @hideResolvedChar = ''
	IF @hideResolved = 1
	BEGIN
		SET @hideResolvedChar = 'R'
	END
	
	SET @today = CONVERT(varchar(10),GETDATE(), 120);

	WITH VW_General AS
	(
		SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) 'Num', COUNT(*) 'Count', A.[callstack_uid], C.[funcname], MAX(A.[version]) 'Version', MAX(A.[date]) 'Latest', D.assign_state,	(SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
		FROM tbl_report A
		INNER JOIN tbl_singlestep C
		 on A.callstack_uid = C.callstack_uid
		  and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
		INNER JOIN tbl_callstack D
		 on A.callstack_uid = D.callstack_uid
		  and D.assign_state <> @hideResolvedChar
		WHERE D.project_uid = @project_uid
		 AND A.[date] >= dateadd(day, -@day_from, @today)
		 AND A.[date] <= dateadd(day, 1-@day_to, @today)
		 AND A.deleted <> 1
		GROUP BY A.[callstack_uid], C.[funcname], D.assign_state
		--ORDER BY [Count] DESC
	)
	SELECT [Count],[callstack_uid],[funcname],[version],[Latest],[assign_state], NumComments
	FROM VW_General
	WHERE Num BETWEEN (@pageNumber-1) * @cntPerPage + 1 AND @pageNumber * @cntPerPage;
	
	WITH VW_Count AS
	(
		SELECT A.[callstack_uid]
		FROM tbl_report A
		INNER JOIN tbl_singlestep C
		 on A.callstack_uid = C.callstack_uid
		  and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
		INNER JOIN tbl_callstack D
		 on A.callstack_uid = D.callstack_uid
		  and D.assign_state <> @hideResolvedChar
		WHERE D.project_uid = @project_uid
		 AND A.[date] >= dateadd(day, -@day_from, @today)
		 AND A.[date] <= dateadd(day, 1-@day_to, @today)
		 AND A.deleted <> 1
		GROUP BY A.[callstack_uid], C.[funcname]
	)
	SELECT @numItems = COUNT(*)
	FROM VW_Count;
	
	return @numItems
END
GO

-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-15
-- Description:	���� ������ȣ�� �ݽ��� ��ȸ.
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_callstack_by_callstack_uid', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_callstack_by_callstack_uid
END
GO
CREATE PROCEDURE dbo.usp_select_callstack_by_callstack_uid
	-- Add the parameters for the stored procedure here
	@callstack_uid	int
,	@rowcount int = 100
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET ROWCOUNT @rowcount;

    -- Insert statements for procedure here
	SELECT [depth], [funcname], [fileline]
	FROM tbl_singlestep
	WHERE [callstack_uid] = @callstack_uid
	ORDER BY [depth] ASC
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2008-08-15
-- Description:	���� ������ȣ�� ���� ��ȸ.
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_report_by_callstack_uid', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_report_by_callstack_uid
END
GO
CREATE PROCEDURE dbo.usp_select_report_by_callstack_uid
	-- Add the parameters for the stored procedure here
	@callstack_uid	int
,	@rowcount int = 100
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET ROWCOUNT @rowcount;

	SELECT A.report_uid, A.login_id, A.ipaddr, A.date, A.callstack_uid, C.funcname, A.version, B.filename, D.assign_state, A.uservoice,	(SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
    FROM tbl_report A
	INNER JOIN tbl_reported_files B
	 on A.report_uid = B.report_uid
	INNER JOIN tbl_singlestep C
	 on A.callstack_uid = C.callstack_uid
	  and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
	INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid
	WHERE A.[callstack_uid] = @callstack_uid
	 AND A.deleted <> 1
	ORDER BY A.[date] DESC
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-17
-- Description:	��ü ���δ�Ʈ ��ȸ
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_project_all', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_project_all
END
GO
CREATE PROCEDURE dbo.usp_select_project_all
AS
BEGIN
	SELECT project_uid, project_name
	FROM tbl_project
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-21
-- Description:	���� �ݽ��� ��ȸ
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_callstack_preview', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_callstack_preview
END
GO
CREATE PROCEDURE dbo.usp_select_callstack_preview
	@callstack_uid	int
AS
BEGIN
	SELECT funcname
	FROM dbo.tbl_singlestep
	WHERE callstack_uid = @callstack_uid
	ORDER BY depth
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-24
-- Description:	�ݽ����� ���� ����
-- =============================================
IF OBJECT_ID(N'dbo.usp_update_callstack_state', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_update_callstack_state
END
GO
CREATE PROCEDURE dbo.usp_update_callstack_state
	@callstack_uid	int
,	@new_state char(1)	-- N:���� ���, I:����, R:�ذ�, W:ó�� ��
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	UPDATE tbl_callstack
	SET assign_state = @new_state
	WHERE callstack_uid = @callstack_uid

END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-25
-- Description:	���� �ϳ��� ���� ���� ����
-- =============================================
IF OBJECT_ID(N'dbo.usp_update_report_state', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_update_report_state
END
GO
CREATE PROCEDURE dbo.usp_update_report_state
	@report_uid	int
,	@new_state	bit = 1
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	UPDATE dbo.tbl_report
	SET deleted = @new_state
	WHERE report_uid = @report_uid

END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-25
-- Description:	������ �׸� ��ȸ
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_report_deleted', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_report_deleted
END
GO
CREATE PROCEDURE dbo.usp_select_report_deleted
	@project_uid	int
AS
BEGIN
	SET NOCOUNT ON;
	SET ROWCOUNT 100;

	SELECT A.report_uid, A.login_id, A.ipaddr, A.date, D.callstack_uid, C.funcname, A.version, B.filename, D.assign_state, A.uservoice,	(SELECT COUNT(callstack_uid) FROM tbl_comment WHERE callstack_uid = A.callstack_uid) 'NumComments'
	FROM tbl_report A
	INNER JOIN tbl_reported_files B on A.report_uid = B.report_uid
	INNER JOIN tbl_singlestep C on A.callstack_uid = C.callstack_uid and C.depth = (SELECT MIN(depth) FROM tbl_singlestep WHERE callstack_uid = A.callstack_uid)
	INNER JOIN tbl_callstack D on A.callstack_uid = D.callstack_uid
	WHERE D.project_uid = @project_uid
	 AND A.deleted = 1
	ORDER BY A.[date] DESC
END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-25
-- Description:	���ں��� ����
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_daily_count', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_daily_count
END
GO
CREATE PROCEDURE dbo.usp_select_daily_count
	@project_uid	int
,	@day_from	smallint
,	@day_to		smallint
AS
BEGIN
	SET NOCOUNT ON;
	
	DECLARE @today	datetime
	SET		@today = CONVERT(varchar(10),GETDATE(), 120)

	SELECT convert(varchar(10),A.[date],120) 'DATE', COUNT(*) 'CNT'
	FROM tbl_report A
	 INNER JOIN tbl_callstack D
	  on A.[callstack_uid] = D.[callstack_uid]
	WHERE D.project_uid = @project_uid
		 AND A.[date] >= dateadd(day, -@day_from, @today)
		 AND A.[date] <= dateadd(day, 1-@day_to, @today)
	GROUP BY convert(varchar(10),A.[date],120)
	ORDER BY 'DATE' DESC

END
GO


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2010-05-26
-- Description:	����Ʈ �м� �ڷ� ����
-- =============================================
IF OBJECT_ID(N'dbo.usp_update_report_delete', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_update_report_delete
END
GO
CREATE PROCEDURE dbo.usp_update_report_delete
	@project_uid	int
,	@report_uid		int
,	@version	nvarchar(50) = null
AS
BEGIN
	SET NOCOUNT ON;
	
	DELETE dbo.tbl_report
	WHERE report_uid = @report_uid

	IF @version is not null
	BEGIN
		DELETE dbo.tbl_report
		WHERE [version] = @version
	END
	
	--DELETE dbo.tbl_reported_files
	--WHERE report_uid = @report_uid	
END
GO



-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2011-05-18
-- Description:	�ڸ�Ʈ �ֱ�
-- =============================================
IF OBJECT_ID(N'dbo.usp_insert_comment', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_insert_comment
END
GO
CREATE PROCEDURE dbo.usp_insert_comment
	@callstack_uid	int
,	@author			nvarchar(50)
,	@comment		nvarchar(512)
AS
BEGIN
	SET NOCOUNT ON;
	
	DECLARE @error	int;
	set @error = 0;

	INSERT INTO dbo.tbl_comment
	VALUES(@callstack_uid, @author, @comment, getdate())

	IF @@ROWCOUNT <> 1
	BEGIN
		SET @error = 100
	END
	
	return @error;
END
GO



-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2011-05-18
-- Description:	�ڸ�Ʈ ��������
-- =============================================

IF OBJECT_ID(N'dbo.usp_select_comment', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_comment
END
GO
CREATE PROCEDURE dbo.usp_select_comment
	@callstack_uid	int
AS
BEGIN
	SET NOCOUNT ON;

	SELECT author,comment,created
	FROM tbl_comment
	WHERE callstack_uid = @callstack_uid
	ORDER BY comment_uid;

END


-----------------------------------------------------------------------------------------------------------------------
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		flow3r
-- Create date: 2011-05-20
-- Description:	������, ���ں��� ����
-- =============================================
IF OBJECT_ID(N'dbo.usp_select_daily_count_per_version', N'P') IS NOT NULL
BEGIN
	DROP PROC dbo.usp_select_daily_count_per_version
END
GO
CREATE PROCEDURE dbo.usp_select_daily_count_per_version
	@callstack_uid	int
,	@day_from	smallint
,	@day_to		smallint
AS
BEGIN
	SET NOCOUNT ON;
	
	DECLARE @today	datetime
	SET		@today = CONVERT(varchar(10),GETDATE(), 120)

	SELECT [version], convert(varchar(10),A.[date],120) 'DATE', COUNT(*) 'CNT'
	FROM tbl_report A
	 INNER JOIN tbl_callstack D
	  on A.[callstack_uid] = D.[callstack_uid]
	WHERE D.callstack_uid = @callstack_uid
		 AND A.[date] >= dateadd(day, -@day_from, @today)
		 AND A.[date] <= dateadd(day, 1-@day_to, @today)
	GROUP BY convert(varchar(10),A.[date],120), [version]
	ORDER BY [version] DESC, 'DATE' DESC

END
GO