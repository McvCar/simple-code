#coding=utf-8
import os,sys
import re

#从输入参数获取文件路径
path = raw_input("input word file directory:")

#获得目录下所有文件列表
def getFileList(dir,fileList):
	if os.path.isfile(dir):
		fileList.append(dir.decode('gbk'))
	elif os.path.isdir(dir):  
		for s in os.listdir(dir):
			newDir=os.path.join(dir,s)
			getFileList(newDir, fileList)  
	return fileList

def loadText(file,arrStr):
	file_object = open(file,'rb')
	dict={}
	for line in file_object:
		strs=re.findall(r'[A-Za-z]+',line)
		#strs=re.findall(r'[A-Za-z0-9_]+',line)
		# print("读：",strs)
		for str in strs:
			if str.find("j") !=-1 and str.find("n") !=-1 and str.find("m") !=-1 :
				arrStr[str] = 1
				if dict.has_key(str):
					dict[str]+=1
				else:
					dict[str]=1
	result=sorted(dict.items(),key=lambda k:k[1],reverse=True)
	file_object.close()
	# print(result)
	return result

arrStr = {}
arrCount = {}
for file in getFileList(path,[]):
	arrCount.update( loadText(file,arrStr)  )

str1 = ""
for text in arrStr:
	str1 +=" " + text

	
# f = open(path+"/words.txt",'w')    #若文件不存在，系统自动创建。'a'
# f.write(str1)   #将字符串写入文件中
# f.close()                   #关闭
print(str1)
raw_input("end...")





















