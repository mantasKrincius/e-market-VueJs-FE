import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        url: "http://localhost:3000/api/v1",
        user: {},
        allPosts: [],
        userPosts: [],
        singlePost: {},
        singleProduct: {},
        userCart: [],
        token: "",
        message: "",
        userQuantity: 0,
        totalPrice: 0,
        userOrders: [],
        favorites: [],
        functions: {}
    },
    mutations: {
        userInfo(state, payload) {
            state.user = payload
        },
        allProducts(state, payload) {
            state.allPosts = payload
        },
        userPosts(state, payload) {
            state.userPosts = payload
        },
        moreInfo(state, payload) {
            state.singlePost = payload
        },
        userCart(state, payload) {
            state.userCart = [payload, ...state.userCart]
            let sum = 0
            for (let i = 0; i < state.userCart.length; i++) {
                sum += state.userCart[i].data.price * state.userCart[i].quantity
            }
            state.totalPrice = sum
        },
        quantity(state, payload) {
            state.userQuantity = payload
        },
        add(state, payload) {
            state.userQuantity = payload
        },
        minus(state, payload) {
            state.userQuantity = payload
        },
        userOrders(state, payload) {
            state.userOrders = payload
        },
        addByTotalPrice(state, payload) {
            state.totalPrice = state.totalPrice + payload
        },
        addFavorites(state, payload) {
            state.favourites = [payload, ...state.favourites]
        },
    },

    actions: {

        addToCart({commit, state}, payload) {
            console.log(payload)
            const item = state.userCart.filter(item => item.data._id === payload.data._id).length
            if (item) {
                state.message = `You already have ${payload.data.name} in Your cart`
                setTimeout(() => state.message = "", 3000)
            } else {
                state.message = `You just added ${payload.data.name} to cart`
                setTimeout(() => state.message = "", 3000)
                commit('userCart', payload)
            }
        },
        add({commit, state}, payload) {
            state.totalPrice += payload.data.price
            commit('add', payload.quantity)
        },
        minus({commit, state}, payload) {
            state.totalPrice -= payload.data.price
            commit('minus', payload.quantity)
        },
        getUserName({commit, state}) {
            if (JSON.parse(localStorage.getItem("shop-user"))) {
                let user = JSON.parse(localStorage.getItem("shop-user"))
                let token = localStorage.getItem("userauth");
                commit('userInfo', user)
                state.token = token
            }
        },
        async register({commit, state}, payload) {
            let response = await fetch(`${state.url}/user/signUp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            console.log(response);
            if (response.status !== 200) return alert("Something went wrong");
            let data = await response.json();
            console.log(data);
        },
        async login({commit, state, dispatch}, payload) {
            try {
                let response = await fetch(`${state.url}/user/signIn`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                setTimeout(() => state.message = "", 3000)
                console.log(response)
                if (response.status !== 200) throw await response.json();
                let token = response.headers.get("userauth");

                localStorage.setItem("userauth", token);
                localStorage.setItem("shop-user", await JSON.stringify(await response.json()));
                dispatch('getUserName')
                dispatch('getUserPosts')
                dispatch('getUserOrders')

            } catch (e) {
                console.log(e);
                state.message = e.message
            }
        },
        async logout({state, dispatch}) {
            //need to check this solution later
            await fetch(`${state.url}/user/logOut`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    userauth: state.token,
                },
            });
            dispatch('getUserName')
            state.user.userStatus = false
            state.user.name = ""
            state.user.token = ""
            state.userCart = []
            state.favorites = []
            localStorage.removeItem("userauth");
            localStorage.removeItem("shop-user");
            localStorage.removeItem("favorites")
        },
        async addPost({commit, state, dispatch}, payload) {
            const formData = new FormData();
            if (!payload.name && !payload.price && !payload.quantity) {
                return state.message = "need to fill"
            }
            setTimeout(() => state.message = "", 3000)
            if (payload.productImage !== 0) {
                formData.append("productImage", payload.productImage);
                //paziureti
            }


            formData.append('userName', state.user.userName)
            formData.append("name", payload.name);
            formData.append("price", payload.price);
            formData.append("description", payload.description);
            formData.append("quantity", payload.quantity);

            try {
                let response = await fetch(`${state.url}/products/myPosts`, {
                    method: "POST",
                    headers: {
                        userauth: state.token,
                    },

                    body: formData,
                });

                if (response.status !== 200) throw await response.json();
                let data = await response.json();
                console.log(data);
                dispatch('getAllPosts')
                dispatch('getUserOrders')
                dispatch('getUserPosts')

            } catch (e) {
                console.log(e);
            }
        },
        async getAllPosts({commit, state}) {
            let response = await fetch(`${state.url}/products`, {
                method: 'GET'
            })

            let products = await response.json()
            commit('allProducts', products)

        },
        async getUserPosts({commit, state}) {
            let response = await fetch(`${state.url}/products/myPosts`, {
                method: "GET",
                headers: {
                    userauth: state.token,
                },
            });

            let data = await response.json();
            commit('userPosts', data)
        },
        async deletePost({commit, state, dispatch}, payload) {
            let body = {
                id: payload
            };
            await fetch(`${state.url}/products/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    userauth: state.token,
                },
                body: JSON.stringify(body),
            });
            dispatch('getUserPosts')
            dispatch('getAllPosts')
        },
        async buy({commit, state}) {
            let body = {
                userId: state.user._id,
                products: state.userCart,
                totalPrice: state.totalPrice
            }

            state.message = "Thank You"
            setInterval(function () {
                window.location.reload()
            }, 2000);


            try {
                let response = await fetch(`${state.url}/user/cart`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        userauth: state.token,
                    },
                    body: JSON.stringify(body)

                });


                if (response.status !== 200) throw await response.json();
                let data = await response.json();
                commit('userCart', data)

            } catch (e) {
                console.log(e);
            }
        },
        async moreInfo({commit, state}, payload) {
            let body = {
                id: payload._id,
            };

            let response = await fetch(`${state.url}/products/single`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    userauth: state.token,
                },
                body: JSON.stringify(body),
            });

            let product = await response.json();
            commit('moreInfo', product)
        },
        async changeQuantity({commit, state}, payload) {
            let amount = payload.data.quantity - payload.quantity
            let body = {
                _id: payload.data._id,
                quantity: amount,
            }
            console.log(state.user._id,)
            state.message = ""
            let response = await fetch(`${state.url}/products/quantity`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    userauth: state.token,
                },
                body: JSON.stringify(body),
            });
            console.log(response);
            if (response.status !== 200) return alert("Something went wrong");
            let data = await response.json();
            console.log(data);
        },
        async editBE({commit, state, dispatch}, payload) {
            let id = payload._id
            let description = payload.description
            let name = payload.name
            let price = payload.price
            let quantity = payload.quantity
            let userId = state.user.id

            let body = {
                userId: userId,
                _id: id,
                description: description,
                price: price,
                name: name,
                quantity: quantity,
            };
            try {
                let response = await fetch(`${state.url}/products/editProduct`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        userauth: state.token,
                    },
                    body: JSON.stringify(body),
                });

                if (response.status !== 200) throw await response.json();
                state.message = `You just change ${payload.name} item`
                setTimeout(function () {
                    state.message = ""
                }, 2000);
                dispatch('getAllPosts')
                dispatch('getUserPosts')
            } catch (e) {
                console.log(e);
            }
        },
        async getUserOrders({commit, state}) {
            let response = await fetch(`${state.url}/products/orders`, {
                method: "GET",
                headers: {
                    userauth: state.token,
                },
            });

            let data = await response.json();
            console.log(data)
            commit('userOrders', data)
        },
    },

})