const GA_TRACKING_ID = 'UA-123735288-3';

let gaExt = document.createElement('script');
gaExt.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
document.children[0].appendChild(gaExt);

window.dataLayer = window.dataLayer || [];

function gtag() {
	window.dataLayer.push(arguments);
}

gtag('js', new Date());
gtag('config', GA_TRACKING_ID);
