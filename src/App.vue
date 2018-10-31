<template>
  <div>
    <div class="flashScreen" :class="appLoaded?'loaded':''"></div>
    <transition :name="transitionName">
      <router-view class="child-view" :init="init">
      </router-view>
    </transition>
    <footerComponent></footerComponent>
  </div>
</template>

<script>
  import { mapGetters,mapActions} from 'vuex'
  import footerComponent from '@/components/footer.vue'

  export default{
    components: {
      footerComponent
    },
    data(){
      return{
        appLoaded:false,
      }
    },
    created(){
    },
    mounted(){
      console.log(utils);
      this.init();
    },
    methods:{
      ...mapActions(['getMetadata','slidePage','setUserOpenId']),
      /**
       * 初始化流程 orgId-openId-预定配置-菜品元数据
       *
       */
      init(flag){
        if(this.$route.name == "checkout"){
          this.appLoaded = true;
          setTimeout(()=>{
            this.$el.firstChild.style.display = "none";
          },1000);
          Vue.nextTick(()=> {
            setTimeout(()=>{
              this.$router.push({ name:'checkout'});
            },100)
          })
        }else{
          let orderId = utils.getUrlValByKey('orderId');
          if(orderId){
            this.appLoaded = true;
            setTimeout(()=>{
              this.$el.firstChild.style.display = "none";
            },1000);
            Vue.nextTick(()=> {
              setTimeout(()=>{
                this.$router.push({ name:'checkout'});
              },100)
            })
          }else{
            this.initData();
          }
        }
      },
      initData(){
        this.getOrgIdOrOpenId().then(()=>{
          return this.getAuthority();
        }).then(()=>{
          return this.initDishes();
        }).then(()=>{
          this.appLoaded = true;
          setTimeout(()=>{
            this.$el.firstChild.style.display = "none";
          },1000);
          Vue.nextTick(()=> {
            setTimeout(()=>{
              this.$router.push({ name:'order'});
            },50)
          })
        }).catch((e)=>{
          console.log(e);
          if(e && e.message){
            this.$alert(e.message).then(()=>{
              utils.weixinBack();
            });
          }
        })
      },
      /**
       * 获取餐厅ID
       *
       */
      getOrgIdOrOpenId(){
        let code = utils.getUrlValByKey('code');
        let orgNo = utils.getUrlValByKey('id');
        let state = utils.getUrlValByKey('state');
        console.log(code,orgNo,state);
        if(code && state){
          this.$store.dispatch('getConfig', {orgId:state});
          return this.getOpenId(code,state);
        }else{
          if(orgNo){
            this.$store.dispatch('getConfig', {orgNo:orgNo});
            return API.send("getOrgId",{orgNo:orgNo}).then((data)=>{
              this.$store.dispatch('getConfig', {orgId:data.result});
              if(window.localStorage.getItem(data.result)){
                let _openId_time = window.localStorage.getItem(data.result);
                let openId_time = JSON.parse(_openId_time);
                if(openId_time.time > new Date().getTime()){
                  this.setUserOpenId(openId_time.value);
                  return Promise.resolve();
                }else{
                  window.localStorage.removeItem(data.result);
                  return this.getAuthUrl();
                }
              }else{
                return this.getAuthUrl();
              }
            }).catch((e)=>{
              console.log(e);
              return Promise.reject({message: e?(e.message?e.message:"获取orgId失败"):""});
            })
          }else{
            return Promise.reject({message:"请通过餐厅的微信公众号打开"});
          }
        }
      },
      /**
       * 获取微信openid 重定向
       *
       */
      getAuthUrl(){
        //return Promise.resolve("test");
        return API.send("getOpenIdRedirect",{
          orgId:this.config.orgId
        }).then((data)=>{
          let url=data.result;
          url=url.replace('#redirect_uri#',encodeURIComponent(window.location.href.split('?')[0]));
          url=url.replace("&state=#state#", "&state="+this.config.orgId);
          window.location.href=url;
        }).catch((e)=>{
          console.log(e);
          return Promise.reject({message:"获取微信重定向url失败"});
        })
      },
      /**
       * 获取微信openid
       *
       */
      getOpenId(code,state){
        //return Promise.resolve("test");
        return API.send("getOpenId",{code:code,orgId:state}).then((data)=>{
          this.setUserOpenId(data.result);
        }).catch((e)=>{
          console.log(e);
          return Promise.reject({message:"获取openId失败"});
        })
      },
      getOrderInfo(){

      },
      /**
       * 老袁 获取预定配置信息
       * 重定向
       */
      getAuthority(){
        return API.send("authority",{
          orgId:this.config.orgId,
          openid:this.userOpenId,
        }).then((data)=>{
          if(data.result.enableWechatTakeOut){
            let startTime = new Date(data.result.wechatTakeOutOpenTime);
            let endTime = new Date(data.result.wechatTakeOutCloseTime);
            let currentTime = new Date().getTime();
            console.log(startTime,endTime,currentTime);
            if(currentTime >= startTime && currentTime < endTime){
              this.$store.dispatch('getConfig', data.result);
            }else{
              return Promise.reject({message:"该餐厅暂未开始接单"});
            }
          }else{
            return Promise.reject({message:"该餐厅暂未开启微信外卖功能"});
          }
        }).catch((e)=>{
          console.log(e);
          return Promise.reject(e);
        })
      },
      /**
       * 初始化菜品元数据
       * 重定向
       */
      initDishes(){
        return API.send("dishesAndType",{
          orgId:this.config.orgId
        }).then((data)=>{
          this.getMetadata(data.result);
        }).catch((e)=>{
          console.log(e);
        })
      },
      test2(){
        this.$loading({text:"加载中"});
      },
    },
    computed:{
      ...mapGetters({
        config:"config",
        userOpenId:"userOpenId",
        transitionName:"transitionName"
      }),
    },
  }
</script>

