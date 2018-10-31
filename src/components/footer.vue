/**
* Created by caoxin@grkj.cn on 2016/12/6.
* http://kd.cc
* Include
* description 页脚
*/
<template>
    <div class="footer">
        <div class="footer-wrap">
            <!--<div class="cart" v-if="!showBtn('order')" :style="{bottom:getBottom}">
                <div class="cart-content" @click="showCart">
                    <i class="icon-cart"></i>
                    <span class="cart-num" v-if="dishNum>0">{{dishNum}}</span>
                </div>
            </div>-->
            <div class="cart" v-if="!showBtn('order')">
                <div class="nav-content" @click="showNav">
                    <i class="icon-nav"></i>
                    <p class="nav-title">导航</p>
                </div>
            </div>
            <div class="order" v-if="showBtn('order')">
                <span class="order-num">数量：{{orderNum}}</span>
            </div>
            <p class="cart-price" :style="{marginLeft:getMl}" v-if="isFirstOrder()">{{showBtn('order')?orderPay:total|currency}}<p>
            <p v-if="showBtn('dishes')" @click="goCart" class="btn big-btn go-order-btn">选好了</p>
            <p v-if="showBtn('cart')" @click="doOrder" class="btn big-btn go-order-btn" :class="{disabled:dishNum <=0}">{{$store.state.SM_IS_NEED_CHECKOUT?"结账下单":"确认下单"}}</p>
            <p v-if="showBtn('order')" @click="doPay" class="btn big-btn go-order-btn">去结账</p>
        </div>
        <!--<cart-component id="cart" v-bind:cartShow="cartShow" />-->
        <nav-component id="nav" v-bind:navShow="navShow" />
        <order-verification-component
            v-bind:verification="verification"
            v-bind:dishSelfMark="dishSelfMark"
            v-bind:dishMark="dishMark"
            v-bind:orderInfo="orderInfo"
            v-bind:updateMark="updateMark"
            v-bind:closeDialog="closeDialog"/>
    </div>
</template>
<script>
    import Api from 'Api'

    export default {
        props: ['status','dishNum','total','dishSelfMark','dishMark','orderInfo','updateMark'],
        data(){
            return{
                cartShow:false,
                navShow:false,
                verification:false
            }
        },
        created(){
          this.$on("showCart",this.showCart);
          this.$on("showNav",this.showNav);
          this.$on("doPay",this.doPay);
        },
        computed: {
            getBottom(){
                if(this.$data.cartShow){
                    var dishLen = this.$store.state.chooseList.length;
                    var size = dishLen > 6?6:dishLen;
                    var bottom = size*60 + 114;
                    return bottom+"px";
                }else{
                    return "8px";
                }
            },
            getMl(){
                if(this.$data.cartShow){
                    return "10px";
                }else{
                    return "75px";
                }
            },
            orderNum(){
                return this.$store.state.detailAmount;
            },
            orderPay(){
                return this.$store.state.payableAmount;
            }
        },
        methods:{
            showBtn(status){
                return this.$route.path.indexOf(status) > -1;
            },
            isFirstOrder(){
                return this.$route.path.indexOf("/dishes") == -1  || this.cartShow;
            },
            goCart(){
                this.cartShow = false;
                this.$router.push({ name:'cart',params:{status:"cart"}});
            },
            doOrder(){
                 var that = this;
                if(that.$store.state.isNeedSMS){
                    this.verification = true;
                }else{
                    this.$store.state.loading("提交中，请稍后");
                    var chooseList = that.$store.state.chooseList;
                    if(!chooseList.length){
                        that.$store.state.alert("请先点菜");
                        return false;
                    }
                    var orderDetail = [];
                    var orderRemark = this.dishSelfMark?(this.dishSelfMark+";"+this.dishMark.toString()):this.dishMark.toString();
                    chooseList.forEach(function(each,index){
                        var tasteName = each.tasteName;
                        var requirement = each.dishSelfMark?(each.dishSelfMark+";"+each.dishMark.toString()):each.dishMark.toString();
                        var detail = {
                            dishId: each.dishId,
                            tasteName: tasteName,
                            quantity: 0,
                            dishName: each.dishName,
                            dishMark: requirement,
                            count: each.dishCount,
                            tc:each.dishPackageStatus,
                            sendStatus:each.sendStatus,
                            sortOrder: ((chooseList.length - index) + that.$store.state.sortOrder) * 1000,
                            dishTasteDetailIds:each.tasteIds,
                            dishTasteDetails:each.tasteNames,
                            dishStandardId:each.checkedStandard?each.checkedStandard.id:"",
                            dishStandardName:each.checkedStandard?each.checkedStandard.standardName:"",
                            dishTasteTotalValue:each.dishTasteTotalValue,
                            dishCurrentPrice:0
                        };
                        if(each.dishPackageStatus){
                            var packageDishes = new Array();
                            _.forEach(each.packageDish.packageGroups,function(group,n){
                                _.forEach(group.dishs,function(dish,m){
                                    if(dish.checked){
                                        var tc_remarks = dish.dishMark.length > 0 ? dish.dishMark.toString() + ';' : '';
                                        var tc_requirement = tc_remarks + dish.dishSelfMark;
                                        packageDishes.push({
                                            dishId: dish.dishId,
                                            tasteName: dish.tasteName,
                                            quantity: 0,
                                            dishName: dish.dishName,
                                            dishMark: tc_requirement,
                                            count: dish.dishNumber,
                                            sendStatus:each.sendStatus,
                                            sortOrder: detail.sortOrder+(n+1)*(m+1),
                                            dishTasteDetailIds:dish.taste.length?dish.taste[0].taste_id:"",
                                            dishTasteDetails:dish.taste.length?dish.taste[0].taste_name:"",
                                            dishStandardId:dish.defaultStandard?dish.defaultStandard.id:"",
                                            dishStandardName:dish.checkedStandard?dish.checkedStandard.standardName:"",
                                            dishTasteTotalValue:0,
                                            dishCurrentPrice:0
                                        });
                                    }
                                });
                            });
                            detail.packageDishes = packageDishes;
                        }
                        orderDetail.unshift(detail);
                    })
                    return Api.send("mobileOrder",{
                        orgId:that.$store.state.config.orgId,
                        tabId:that.$store.state.config.tabId,
                        orderDetail:JSON.stringify(orderDetail),
                        orderRemark:orderRemark,
                        serverUUId:""
                    }).then(function(data){
                        if(data){
                            that.$store.state.tips("下单成功");
                            that.$store.commit('clearCart');
                            that.orderInfo().then(function(){
                                that.closeDialog();
                                that.updateMark("","");
                                if(that.$store.state.SM_IS_NEED_CHECKOUT){
                                    that.doPay(data.result.orderId);
                                }else{
                                    that.$store.state.loaded();
                                    that.$router.push({ name:'order',params:{status:"order"}});
                                }
                            });
                        }else{
                            that.$store.state.loaded();
                        }
                    }).catch(function(error){
                        that.$store.state.loaded();
                        if(error.message.indexOf("未开台") > - 1){
                            that.$store.state.tips("请先开台");
                            that.$store.state.isOpen = false;
                            return false;
                        }
                        that.$store.state.tips(error.message);
                        that.code = "";
                    });
                }
            },
            doPay(_orderId){
                var that = this;
                that.$store.state.loaded();
                that.orderInfo().then(function(){
                    var tableStatus = that.$store.state.tableStatus;
                    if(tableStatus < 74){
                        var orgId = that.$store.state.config.orgId;
                        var orderId = _orderId?orderId:that.$store.state.orderId;
                        var query = orgId+"_"+orderId;
                        if(orderId || _orderId){
                            if(window.location.hostname.indexOf("kdcdn") > -1){
                                window.location.href = "http://ma.kdcdn.cn/rms/pay/qrcode/offline_send_redirect?state="+query
                            }else{
                                window.location.href = "http://ma.kd.cc/rms/pay/qrcode/offline_send_redirect?state="+query
                            }
                        }else{
                            if(tableStatus > 22){
                                that.$store.state.alert("您好，<br/>请等待服务员确认订单后再进行支付!");
                            }else{
                                that.$store.state.alert("您好，<br/>您还未下单，请下单后再结账!");
                            }
                        }
                    }else{
                        that.$store.state.alert("您好，<br/>当前餐桌已经结算!");
                    }
                })
            },
            showCart(){
                var cartShow = this.cartShow;
                if(!this.$store.state.chooseList.length){
                   if(cartShow){
                        this.$parent.$emit("clearWholeFood");
                        this.cartShow = !cartShow;
                    }else{
                        return false;
                    }
                }
                this.cartShow = !cartShow;
            },
            showNav(flag){
                if(flag instanceof Boolean){
                    this.navShow = flag;
                }else{
                    var navShow = this.navShow;
                    this.navShow = !navShow;
                }

            },
            closeDialog(){
                this.verification = false;
            }
        },
        components: {
        }
    }

</script>