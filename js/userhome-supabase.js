import { supabase, requireUser, signOutUser } from './supabase.js';

const dishesEl=document.getElementById('dishesShowList');
const cartEl=document.getElementById('cartItemsContainer');
const cartCount=document.querySelector('.cart-num');
const totalEl=document.getElementById('cartTotal');
let user=null,dishes=[],cart=JSON.parse(localStorage.getItem('foodpapa-cart')||'[]');
const esc=v=>String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function load(){
 user=await requireUser(); if(!user)return;
 const {data,error}=await supabase.from('dishes').select('*').eq('status','active').order('created_at',{ascending:false});
 if(error){dishesEl.innerHTML='<p class="text-center text-danger">Unable to load dishes.</p>';return}
 dishes=data||[];
 const [{data:likes},{data:favs}]=await Promise.all([
  supabase.from('dish_likes').select('dish_id').eq('user_id',user.id),
  supabase.from('dish_favorites').select('dish_id').eq('user_id',user.id)
 ]);
 const liked=new Set((likes||[]).map(x=>x.dish_id)),fav=new Set((favs||[]).map(x=>x.dish_id));
 if(!dishes.length){dishesEl.innerHTML='<div class="col-12 text-center py-5">No dishes available right now.</div>';return}
 dishesEl.innerHTML=dishes.map(d=>`<div class="col-md-4 mb-4"><div class="card h-100"><img src="${esc(d.image_url||'../Images/dish-1.jpg')}" class="card-img-top" style="height:210px;object-fit:cover" alt="${esc(d.name)}"><div class="card-body d-flex flex-column"><span class="small fw-bold text-orange">${esc(d.category||'Chef Special')}</span><h5 class="card-title mt-2">${esc(d.name)}</h5><p class="card-text text-secondary flex-grow-1">${esc(d.description||'Freshly prepared for you.')}</p><div class="d-flex align-items-center gap-2"><strong class="text-orange me-auto">Rs. ${Number(d.price||0).toLocaleString()}</strong><button class="like-btn ${liked.has(d.id)?'liked':''}" onclick="toggleLike('${d.id}',${liked.has(d.id)})"><i class="fa-${liked.has(d.id)?'solid':'regular'} fa-heart"></i></button><button class="fav-btn ${fav.has(d.id)?'favorited':''}" onclick="toggleFavorite('${d.id}',${fav.has(d.id)})"><i class="fa-${fav.has(d.id)?'solid':'regular'} fa-bookmark"></i></button><button class="btn btn-orange" onclick="addToCart('${d.id}')">Add to Cart</button></div></div></div></div>`).join('');
 renderCart();
}
window.toggleLike=async(id,active)=>{const r=active?await supabase.from('dish_likes').delete().eq('dish_id',id).eq('user_id',user.id):await supabase.from('dish_likes').insert({dish_id:id,user_id:user.id});if(r.error)Swal.fire('Error',r.error.message,'error');else load()};
window.toggleFavorite=async(id,active)=>{const r=active?await supabase.from('dish_favorites').delete().eq('dish_id',id).eq('user_id',user.id):await supabase.from('dish_favorites').insert({dish_id:id,user_id:user.id});if(r.error)Swal.fire('Error',r.error.message,'error');else load()};
window.addToCart=id=>{const d=dishes.find(x=>x.id===id);if(!d)return;const item=cart.find(x=>x.id===id);if(item)item.quantity++;else cart.push({id:d.id,name:d.name,price:Number(d.price||0),quantity:1,image:d.image_url});saveCart();renderCart();Swal.fire({toast:true,position:'top-end',icon:'success',title:'Added to cart',showConfirmButton:false,timer:900})};
window.changeQty=(id,delta)=>{const item=cart.find(x=>x.id===id);if(!item)return;item.quantity+=delta;if(item.quantity<=0)cart=cart.filter(x=>x.id!==id);saveCart();renderCart()};
function saveCart(){localStorage.setItem('foodpapa-cart',JSON.stringify(cart));cartCount.textContent=cart.reduce((s,x)=>s+x.quantity,0)}
function renderCart(){saveCart();if(!cart.length){cartEl.innerHTML='<div class="text-center py-5 text-secondary">Your cart is empty.</div>';if(totalEl)totalEl.textContent='Rs. 0';return}let total=0;cartEl.innerHTML=cart.map(x=>{total+=x.price*x.quantity;return `<div class="d-flex align-items-center gap-3 py-3 border-bottom"><img src="${esc(x.image||'../Images/dish-1.jpg')}" style="width:58px;height:58px;object-fit:cover;border-radius:12px"><div class="flex-grow-1"><strong>${esc(x.name)}</strong><div class="small text-secondary">Rs. ${x.price.toLocaleString()}</div></div><div class="d-flex align-items-center gap-2"><button class="btn btn-sm btn-light" onclick="changeQty('${x.id}',-1)">−</button><span>${x.quantity}</span><button class="btn btn-sm btn-light" onclick="changeQty('${x.id}',1)">+</button></div></div>`}).join('');if(totalEl)totalEl.textContent=`Rs. ${total.toLocaleString()}`}

document.getElementById('placeOrderBtn')?.addEventListener('click',async()=>{if(!cart.length){Swal.fire('Cart empty','Add a dish first.','info');return}const total=cart.reduce((s,x)=>s+x.price*x.quantity,0);const {data:order,error}=await supabase.from('food_orders').insert({user_id:user.id,customer_name:user.user_metadata?.full_name||user.email?.split('@')[0]||'Customer',customer_email:user.email,total,status:'pending'}).select().single();if(error){Swal.fire('Error',error.message,'error');return}const {error:itemError}=await supabase.from('food_order_items').insert(cart.map(x=>({order_id:order.id,dish_id:x.id,dish_name:x.name,unit_price:x.price,quantity:x.quantity,line_total:x.price*x.quantity})));if(itemError){Swal.fire('Error',itemError.message,'error');return}cart=[];saveCart();renderCart();Swal.fire('Order placed','Your order has been sent to the kitchen.','success')});
window.logout=()=>signOutUser();load();
