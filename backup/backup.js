// function createProductCards(products) {
//   return products.map(product => {
//     const imageUrl = product.defaultImage ? product.defaultImage.url : defaultImageUrl;
//     return `
//       <div class="related-products-swiper-slide swiper-slide">
//         <div class="product-card">
//           <div class="card-image-container">
//               <img src="${imageUrl}" alt="${product.name}" />
//           </div>
//           <div class="card-information-wrapper">
//               <div class="card-information-container">
//                   <div class="card-group-container">
//                       <span class="brand--name">${product?.brand?.name ?? ''}</span>
//                   </div>
//                   <div class="product--title-container">
//                           <a href="${product?.path}" tabindex="0">
//                           ${product?.name}
//                       </a>
//                   </div>
//                   <div class="price--container">
//                       <p class="price-money">${product?.prices?.price?.currencyCode ?? ''} ${product?.prices?.price?.value ?? ''}</p>
//                   </div>
//               </div>
//               <div class="card-button-container">
//                   <!--
//                    <p>Status: ${product.availabilityV2.status}</p>
//                    <a href="${product.addToCartUrl}" target="_blank" class="button button-container">Add to Cart</a>\
//                   -->
//                   <a href="${product?.path}" class="button-link-to">View Details</a>
//               </div>
//           </div>
//         </div>
//       </div>
//     `;
//   }).join('');
// }

// function createTabs(data) {
//   const tabs = Object.keys(data).filter(key => data[key].length > 0);
//   const tabHeaders = tabs.map(tab => `<button class="tablink" onclick="openTab(event, '${tab}')">${tab}</button>`).join('');
//   const tabContents = tabs.map(tab => `
//     <div id="${tab}" class="tabcontent related-products--tab-content">
//       <div class="related-products-swiper-container swiper-container">
//         <div class="related-products-swiper-wrapper swiper-wrapper">
//           ${createProductCards(data[tab])}
//         </div>
//       </div>
//       <div class="related-products-swiper-button-next swiper-button-next"></div>
//         <div class="related-products-swiper-button-prev swiper-button-prev"></div>
//     </div>
//   `).join('');

//   return `
//       <section id="sacra-custom-realted-product" class="sacra-section">
//       <div class="sa-custom-related-product-container sacra-page-width" >
//           <div class="sacra-inner-wrapper">
//               <div class="sacra-inner-container">
//                   <h2>${storeData?.heading ?? ''}</h2>
//                   <span>${storeData?.sub_heading ?? ''}</span>
//               </div>
//               </div>
//               <div class="related-products--wrapper">
//               <div class="sacra-tab tab-wrapper">
//                   ${tabHeaders}
//               </div>
//               ${tabContents}
//           </div>
//       </div>
//     </section>
//   `;
// }