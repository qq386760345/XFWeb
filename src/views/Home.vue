<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <img src="../assets/logo.png" alt="Logo" class="logo">
        <span class="title">智慧办公SaaS平台</span>
      </div>
      <div class="header-right">
        <el-menu mode="horizontal" :router="true">
          <el-menu-item index="/product">产品</el-menu-item>
          <el-menu-item index="/enterprise">企业服务</el-menu-item>
          <el-menu-item index="/mall">商城</el-menu-item>
          <el-menu-item index="/download">下载中心</el-menu-item>
          <el-menu-item index="/help">帮助中心</el-menu-item>
        </el-menu>
        <el-button type="primary" class="login-btn">登录/注册</el-button>
        <el-button type="primary" class="download-btn">下载</el-button>
      </div>
    </el-header>

    <!-- 产品卡片区域 -->
    <div class="product-section">
      <div class="product-cards">
        <el-card 
          class="product-card" 
          v-for="(product, index) in products" 
          :key="index"
          @click="handleProductClick(product)"
        >
          <div class="card-content">
            <img :src="product.icon" :alt="product.name" class="product-icon">
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 更多服务区域 -->
    <div class="services-section">
      <h2 class="section-title">更多服务 满足更多场景</h2>
      <div class="service-cards">
        <el-card class="service-card" v-for="(service, index) in services" :key="index">
          <img :src="service.icon" :alt="service.name" class="service-icon">
          <h3>{{ service.name }}</h3>
          <p>{{ service.description }}</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const products = ref([
  {
    name: '讯飞听见',
    description: '你的随身录音记录助手',
    icon: './assets/product1.png',
    route: '/tingjian'
  },
  {
    name: '讯飞写作',
    description: 'AI写作，让你更高效',
    icon: './assets/product2.png'
  },
  {
    name: '讯飞同传',
    description: '多语种会议同传服务',
    icon: './assets/product3.png'
  },
  {
    name: '讯飞译制',
    description: '一站式多语种视频翻译',
    icon: './assets/product4.png'
  }
])

const services = ref([
  {
    name: '听见智能会议系统',
    description: '本地化部署，智能安全',
    icon: './assets/service1.png'
  },
  {
    name: '文档音视频翻译',
    description: '文档翻译精准高效送达',
    icon: './assets/service2.png'
  },
  {
    name: '智慧媒体解决方案',
    description: 'AI智慧媒体整体解决方案',
    icon: './assets/service3.png'
  },
  {
    name: '行业定制化解决方案',
    description: '满大平台的企业办公定制服务',
    icon: './assets/service4.png'
  }
])

const handleProductClick = (product) => {
  if (product.route) {
    router.push(product.route)
  }
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 60px;

  .header-left {
    display: flex;
    align-items: center;
    
    .logo {
      height: 40px;
      margin-right: 10px;
    }

    .title {
      font-size: 18px;
      font-weight: bold;
    }
  }

  .header-right {
    display: flex;
    align-items: center;

    .el-menu {
      border: none;
      margin-right: 20px;
    }

    .login-btn, .download-btn {
      margin-left: 10px;
    }
  }
}

.product-section {
  padding: 40px 20px;
  
  .product-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .product-card {
    text-align: center;
    transition: transform 0.3s;
    cursor: pointer;

    &:hover {
      transform: translateY(-5px);
    }

    .product-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 15px;
    }

    h3 {
      margin: 10px 0;
      font-size: 18px;
    }

    p {
      color: #666;
      font-size: 14px;
    }
  }
}

.services-section {
  padding: 40px 20px;
  background: #fff;

  .section-title {
    text-align: center;
    font-size: 28px;
    margin-bottom: 40px;
  }

  .service-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .service-card {
    text-align: center;
    padding: 20px;

    .service-icon {
      width: 60px;
      height: 60px;
      margin-bottom: 15px;
    }

    h3 {
      margin: 10px 0;
      font-size: 16px;
    }

    p {
      color: #666;
      font-size: 14px;
    }
  }
}
</style> 