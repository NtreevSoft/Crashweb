rem �������� �����췯�� �ֱ����� ��ũ��Ʈ ���� ���.
schtasks /Create /SC MINUTE /MO 1 /ST 09:00 /TN CrashWebCrawlerALL /TR %CD%\CWRUN.js
schtasks /Create /SC DAILY /MO 1 /ST 09:00 /TN CrashWebDeleterALL /TR %CD%\DeleteOld.js
pause