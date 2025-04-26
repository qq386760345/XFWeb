# API 文档

## 讯飞语音识别 API

### 接口说明
- 接口地址：`https://spark-api-open.xf-yun.com/v2`
- 请求方式：WebSocket
- 数据格式：JSON

### 请求参数
```json
{
  "header": {
    "app_id": "your_app_id",
    "uid": "user_id"
  },
  "parameter": {
    "chat": {
      "domain": "general",
      "temperature": 0.5,
      "max_tokens": 2048
    }
  },
  "payload": {
    "message": {
      "text": [
        {
          "role": "user",
          "content": "用户输入内容"
        }
      ]
    }
  }
}
```

### 响应参数
```json
{
  "header": {
    "code": 0,
    "message": "Success",
    "sid": "会话ID"
  },
  "payload": {
    "choices": {
      "status": 2,
      "seq": 0,
      "text": [
        {
          "content": "AI 响应内容",
          "role": "assistant",
          "index": 0
        }
      ]
    }
  }
}
```

### 错误码说明
| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 10000 | 参数错误 |
| 10001 | 认证失败 |
| 10002 | 服务不可用 |
| 10003 | 请求超时 |
| 10004 | 内部错误 |

## 本地 API

### 文件管理 API

#### 获取文件列表
- 请求方式：GET
- 接口地址：`/api/files`
- 请求参数：
  ```json
  {
    "type": "recent", // recent, my, favorite, trash
    "page": 1,
    "pageSize": 10
  }
  ```
- 响应数据：
  ```json
  {
    "code": 0,
    "data": {
      "list": [
        {
          "id": "file_id",
          "name": "文件名",
          "type": "文件类型",
          "size": "文件大小",
          "createTime": "创建时间",
          "updateTime": "更新时间"
        }
      ],
      "total": 100
    }
  }
  ```

#### 创建文件
- 请求方式：POST
- 接口地址：`/api/files`
- 请求参数：
  ```json
  {
    "name": "文件名",
    "type": "文件类型"
  }
  ```
- 响应数据：
  ```json
  {
    "code": 0,
    "data": {
      "id": "file_id",
      "name": "文件名",
      "type": "文件类型",
      "createTime": "创建时间"
    }
  }
  ```

#### 删除文件
- 请求方式：DELETE
- 接口地址：`/api/files/:id`
- 响应数据：
  ```json
  {
    "code": 0,
    "message": "删除成功"
  }
  ```

### 音频处理 API

#### 上传音频
- 请求方式：POST
- 接口地址：`/api/audio/upload`
- 请求参数：FormData
  - file: 音频文件
  - type: 音频类型
- 响应数据：
  ```json
  {
    "code": 0,
    "data": {
      "url": "音频文件URL",
      "duration": "音频时长",
      "size": "文件大小"
    }
  }
  ```

#### 获取音频信息
- 请求方式：GET
- 接口地址：`/api/audio/:id`
- 响应数据：
  ```json
  {
    "code": 0,
    "data": {
      "id": "音频ID",
      "url": "音频文件URL",
      "duration": "音频时长",
      "size": "文件大小",
      "createTime": "创建时间"
    }
  }
  ```

## 错误处理
1. **请求错误**
   ```javascript
   try {
     const response = await fetch('/api/endpoint');
     if (!response.ok) {
       throw new Error('请求失败');
     }
     const data = await response.json();
   } catch (error) {
     console.error('请求错误:', error);
     // 错误处理
   }
   ```

2. **WebSocket 错误**
   ```javascript
   const ws = new WebSocket('wss://api.example.com');
   ws.onerror = (error) => {
     console.error('WebSocket 错误:', error);
     // 错误处理
   };
   ```

3. **重试机制**
   ```javascript
   async function fetchWithRetry(url, options, retries = 3) {
     try {
       const response = await fetch(url, options);
       if (!response.ok) throw new Error('请求失败');
       return response;
     } catch (error) {
       if (retries > 0) {
         return fetchWithRetry(url, options, retries - 1);
       }
       throw error;
     }
   }
   ``` 