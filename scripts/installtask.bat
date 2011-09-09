rem 윈도우즈 스케쥴러에 주기적인 스크립트 실행 등록.
schtasks /Create /SC MINUTE /MO 1 /ST 09:00 /TN CrashWebCrawlerALL /TR %CD%\CWRUN.js
schtasks /Create /SC DAILY /MO 1 /ST 09:00 /TN CrashWebDeleterALL /TR %CD%\DeleteOld.js
pause