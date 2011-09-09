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
-- 테이블 생성

USE [CRASHWEB_DB]
GO

IF OBJECT_ID(N'dbo.tbl_singlestep', N'U') IS NOT NULL
BEGIN
	DROP TABLE dbo.tbl_singlestep
END
GO
IF OBJECT_ID(N'dbo.tbl_report', N'U') IS NOT NULL
BEGIN
	DROP TABLE dbo.tbl_report
END
GO
IF OBJECT_ID(N'dbo.tbl_callstack', N'U') IS NOT NULL
BEGIN
	DROP TABLE dbo.tbl_callstack
END
GO
IF OBJECT_ID(N'dbo.tbl_reported_files', N'U') IS NOT NULL
BEGIN
	DROP TABLE dbo.tbl_reported_files
END
GO
IF OBJECT_ID(N'dbo.tbl_project', N'U') IS NOT NULL
BEGIN
	DROP TABLE dbo.tbl_project
END
GO

IF OBJECT_ID(N'dbo.tbl_comment', N'U') IS NOT NULL
BEGIN
	DROP TABLE dbo.tbl_comment
END
GO

/****** Object:  Table [dbo].[tbl_project]    Script Date: 05/27/2010 11:24:15 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tbl_project](
	[project_uid] [int] IDENTITY(1,1) NOT NULL,
	[project_name] [nvarchar](50) NOT NULL,
 CONSTRAINT [PK_tbl_product] PRIMARY KEY CLUSTERED 
(
	[project_uid] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

/****** Object:  Table [dbo].[tbl_reported_files]    Script Date: 05/27/2010 11:24:22 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tbl_reported_files](
	[report_uid] [int] IDENTITY(1,1) NOT NULL,
	[filename] [nvarchar](260) NOT NULL,
	[date] [datetime] NOT NULL,
 CONSTRAINT [PK_tbl_reported_files] PRIMARY KEY CLUSTERED 
(
	[report_uid] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

/****** Object:  Table [dbo].[tbl_callstack]    Script Date: 07/16/2010 10:33:01 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[tbl_callstack](
	[callstack_uid] [int] IDENTITY(1,1) NOT NULL,
	[parent_uid] [int] NULL,
	[project_uid] [int] NOT NULL,
	[signature] [binary](16) NOT NULL,
	[assign_state] [char](1) NOT NULL,
	[warned] [smalldatetime] NULL,
 CONSTRAINT [PK_tbl_callstack] PRIMARY KEY CLUSTERED 
(
	[callstack_uid] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

ALTER TABLE [dbo].[tbl_callstack]  WITH NOCHECK ADD  CONSTRAINT [FK_tbl_callstack_tbl_callstack] FOREIGN KEY([parent_uid])
REFERENCES [dbo].[tbl_callstack] ([callstack_uid])
GO

ALTER TABLE [dbo].[tbl_callstack] CHECK CONSTRAINT [FK_tbl_callstack_tbl_callstack]
GO

ALTER TABLE [dbo].[tbl_callstack]  WITH NOCHECK ADD  CONSTRAINT [FK_tbl_callstack_tbl_product] FOREIGN KEY([project_uid])
REFERENCES [dbo].[tbl_project] ([project_uid])
GO

ALTER TABLE [dbo].[tbl_callstack] CHECK CONSTRAINT [FK_tbl_callstack_tbl_product]


/****** Object:  Table [dbo].[tbl_report]    Script Date: 05/27/2010 11:24:28 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tbl_report](
	[report_uid] [int] NOT NULL,
	[acnt_uid] [int] NOT NULL,
	[login_id] [nvarchar](50) NOT NULL,
	[user_uid] [int] NOT NULL,
	[nickname] [nvarchar](50) NOT NULL,
	[ipaddr] [nvarchar](50) NOT NULL,
	[date] [datetime] NOT NULL,
	[version] [nvarchar](50) NOT NULL,
	[callstack_uid] [int] NOT NULL,
	[uservoice] [nvarchar](260) NOT NULL,
	[deleted] [bit] NOT NULL,
 CONSTRAINT [PK_tbl_report] PRIMARY KEY NONCLUSTERED 
(
	[report_uid] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[tbl_report]  WITH NOCHECK ADD  CONSTRAINT [FK_tbl_report_tbl_callstack] FOREIGN KEY([callstack_uid])
REFERENCES [dbo].[tbl_callstack] ([callstack_uid])
GO

ALTER TABLE [dbo].[tbl_report] CHECK CONSTRAINT [FK_tbl_report_tbl_callstack]
GO

ALTER TABLE [dbo].[tbl_report]  WITH NOCHECK ADD  CONSTRAINT [FK_tbl_report_tbl_reported_files] FOREIGN KEY([report_uid])
REFERENCES [dbo].[tbl_reported_files] ([report_uid])
GO

ALTER TABLE [dbo].[tbl_report] CHECK CONSTRAINT [FK_tbl_report_tbl_reported_files]
GO


/****** Object:  Table [dbo].[tbl_singlestep]    Script Date: 05/27/2010 11:24:47 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tbl_singlestep](
	[callstack_uid] [int] NOT NULL,
	[depth] [smallint] NOT NULL,
	[funcname] [nvarchar](260) NOT NULL,
	[fileline] [nvarchar](260) NOT NULL
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[tbl_singlestep]  WITH NOCHECK ADD  CONSTRAINT [FK_tbl_singlestep_tbl_callstack] FOREIGN KEY([callstack_uid])
REFERENCES [dbo].[tbl_callstack] ([callstack_uid])
GO

ALTER TABLE [dbo].[tbl_singlestep] CHECK CONSTRAINT [FK_tbl_singlestep_tbl_callstack]
GO

-- 2010.06.21 by devryu
create index ncidx_tbl_reported_files_filename on tbl_reported_files([filename]);
GO

-- 2011.03.11 flow3r
create CLUSTERED index cidx_tbl_report_date on tbl_report([date]);
create NONCLUSTERED index ncidx_tbl_singlestep_callstack_uid on tbl_singlestep([callstack_uid]);
create CLUSTERED index cidx_tbl_singlestep_depth on tbl_singlestep([depth]);


-- 2011.05.18 flow3r: 새 테이블 추가(tbl_comment)

/****** Object:  Table [dbo].[tbl_comment]    Script Date: 05/18/2011 12:33:49 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tbl_comment](
	[comment_uid] [int]  IDENTITY(1,1) NOT NULL,
	[callstack_uid] [int] NOT NULL,
	[author] [nvarchar](50) NOT NULL,
	[comment] [nvarchar](512) NOT NULL,
	[created] [datetime] NOT NULL,
	CONSTRAINT [PK_tbl_comment] PRIMARY KEY CLUSTERED ([comment_uid] ASC)
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[tbl_comment]  WITH CHECK ADD  CONSTRAINT [FK_tbl_comment_tbl_callstack] FOREIGN KEY([callstack_uid])
REFERENCES [dbo].[tbl_callstack] ([callstack_uid])
GO

ALTER TABLE [dbo].[tbl_comment] CHECK CONSTRAINT [FK_tbl_comment_tbl_callstack]
GO

/****** Object:  Index [IX_tbl_comment]    Script Date: 05/18/2011 12:34:27 ******/
CREATE NONCLUSTERED INDEX [IX_tbl_comment] ON [dbo].[tbl_comment] 
(
	[callstack_uid] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
GO

