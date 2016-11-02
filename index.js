export function buildView(loader, scenes) {

	if (!loader && !PIXI.loader) throw new Error('Missing PIXI loader.');

	const { width, height } = calcViewport();
	const { width: cellSizeWidth, height: cellSizeHeight } = getCellSize();
 	const { width: cellWidth, height: cellHeight } = getCellAmount();

	const view = {
		renderer: new PIXI.autoDetectRenderer(width, height, { transparent: true, resolution: window.devicePixelRatio, autoResize: true, roundPixels: true }),
		renderLayer: new PIXI.Container(),
		interactLayer: new PIXI.Container(),
		mainLayer: new PIXI.Container(),
 		gridLayer: new PIXI.ParticleContainer(15000, { alpha: true, uvs: true  }),
		actorLayer1: {
			container: new PIXI.ParticleContainer(15000, {alpha: true, uvs: true }),
			sprites: []
		},
		actorLayer2:{
			container: new PIXI.ParticleContainer(15000, {alpha: true, uvs: true }),
			sprites: []
		},
		extraLayer: {
			container: new PIXI.ParticleContainer(15000, {alpha: true, uvs: true }),
			sprites: []
		},
		extraLayer2: new PIXI.Container(),
		textLayer: new PIXI.Container(),
		textures: [],
		active: -1,
		currentBg: -1
	};

		
	updateView(view, loader, scenes)

	// Add to mainLayer in the order of z-index
	view.mainLayer.addChild( 
		view.actorLayer2.container,
		view.actorLayer1.container, 
	 
		view.extraLayer2, 
	);

	view.interactLayer.addChild(
			view.extraLayer.container,
 	 	view.gridLayer,
 	 	view.textLayer
		 
	);

	view.renderLayer.addChild(
		view.mainLayer,
	 view.interactLayer
	);


	return view;
}

 

export function updateView(view, loader, scenes) {

 
 	const { width, height } = calcViewport();
	const { width: cellSizeWidth, height: cellSizeHeight } = getCellSize();
 	const { width: cellWidth, height: cellHeight } = getCellAmount();


	view.renderLayer.position.set(-cellSizeWidth, -cellSizeHeight);

 
	view.actorLayer1.sprites = updateLayer(view.actorLayer1.container);
	view.actorLayer2.sprites = updateLayer(view.actorLayer2.container);
    view.extraLayer.sprites = updateLayer(view.extraLayer.container);


	view.gridLayer.removeChildren();
 
	const horizontalTexture = createGraphicTexture(0xffffff, 0, 0, width + 100, 1);
	const verticalTexture = createGraphicTexture(0xffffff, 0, 0, 1, height + 100);

	for (let h = 0; h < cellHeight ; h++) {
		view.gridLayer.addChild(createSprite(horizontalTexture, 0, h * cellSizeHeight, 0.03))
		if ( h === 0 ) {
			for (let w = 0; w < cellWidth ; w++) {
				view.gridLayer.addChild(createSprite(verticalTexture, w * cellSizeWidth, 0, 0.03))
			}
		}
	}	


	view.textLayer.removeChildren();

	const text = new PIXI.Text('Pc',{font : '130vw nimbus-sans', fill : 0xD0D0D0, align : 'center'});
	text.alpha = 0.03;
	text.anchor.set(0.5);
	text.position.set(width/2, height/2);
	view.textLayer.addChild(text);


 

}


export function getTexture(view, index, h, w) {
	return view.textures[index][h][w];
}


export function updateLayer(container) {

	container.removeChildren();

	const { width: cellSizeWidth, height: cellSizeHeight } = getCellSize();
	const { width, height } = getCellAmount();
	const spriteObj = []; 
 
	for (let h = 0; h < height ; h++) {
		spriteObj.push([])
		for (let w = 0; w < width ; w++) {
			let sprite = createSprite(null, w * cellSizeWidth, h * cellSizeHeight, 0);
			sprite.width = cellSizeWidth;
			sprite.height = cellSizeHeight;
			spriteObj[h].push(sprite);
			container.addChild(sprite);
		}
	}
	return spriteObj;
}





export function gotoBackground(view, base) {
	const { width, height } = getCellSize();
	const baseTexture = PIXI.loader.resources[base].texture;
	const { width: widthAmount, height: heightAmount } = getCellAmount();
 	const ratio = Math.floor(Math.min(baseTexture.height / heightAmount, baseTexture.width / widthAmount));

 	var prevLayer, nextLayer;

 	if (view.active != 1) {
 		view.active = 1;
 		prevLayer = 'actorLayer2';
 		nextLayer = 'actorLayer1';
 	}
 	else {
 		view.active = 2;
 		prevLayer = 'actorLayer1';
 		nextLayer = 'actorLayer2';
 	}
 
	const maxHeight = heightAmount;
	const maxWidth = widthAmount;
	const fillTexture = createGraphicTexture(0x000000, 0, 0, width, height);

	for ( let h=0; h < maxHeight; h++ ) {

		for ( let w=0; w < maxWidth; w++ ) {

			view.extraLayer.sprites[h][w].texture = fillTexture;
			view[nextLayer].sprites[h][w].texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(w * ratio, h * ratio, ratio, ratio));
 
			let alpha = (1 - (((h)/maxHeight)));
			let rand = (Math.round(Math.random() * 100) / 100);

 			TweenMax.to(
 				view[prevLayer].sprites[h][w], 
 				rand * 1, 
 				{ alpha: 0 }
 			).delay(1 * ((h/maxHeight)));


	 		TweenMax.fromTo(
	 			view[nextLayer].sprites[h][w], 
	 			rand * 1, 
	 			{ alpha: 0 }, 
	 			{ alpha }
	 		).delay(1 * ((h/maxHeight)));


	 		TweenMax.fromTo(
	 			view.extraLayer.sprites[h][w],  
	 			(rand * 1) /2, 
	 			{ alpha: 0 }, 
	 			{ alpha: 0.07, 
	 				onComplete: () => { 
	 					TweenMax.to(
	 						view.extraLayer.sprites[h][w], 
	 						(rand * 1) /2, 
	 						{ alpha: 0 }
	 					).delay((1 * ((h/maxHeight))) / 2);
	 				}, 
	 			})
	 		.delay((1 * ((h/maxHeight))) /2);
		}
	}
}

export function createGraphicTexture(color, x, y, width, height) {
 	const fillRect = new PIXI.Graphics();
	fillRect.beginFill(color);
	fillRect.drawRect(x, y, width, height);
	fillRect.endFill();
	return fillRect.generateTexture();
}

export function createSprite(texture, x, y, alpha) {
	let sprite = null;

	if (texture) sprite = new PIXI.Sprite(texture);
	else sprite = new PIXI.Sprite();
			  
	sprite.position.x = x;
	sprite.position.y = y;	
	sprite.alpha = alpha;

	return sprite;
}


export function calcViewport() {

		return {
			width: (window.innerWidth > 0) ? window.innerWidth : screen.width,
			height:  (window.innerHeight > 0) ? window.innerHeight : screen.height
		}
}


export function getCellSize() {

	// add extra cells for mouse move interaction
	const padding = 2;

	const { width, height } =  calcViewport();
	const { width: cellWidthAmount, height: cellHeightAmount } =  getCellAmount();

 
	return {
		width: width / (cellWidthAmount - padding),
		height: height / (cellHeightAmount - padding)
	}
 
 
}

export function getCellAmount() {

	const { width, height } =  calcViewport();

	const wide = 20;
	const tall = 10;

	// portrait view 
	if ( height >= width ) {

		return {
			width: tall,
			height: ((height - (height % ( width / tall ))) / ( width / tall ) )
		}
 
	}
	else {
		return {
			width: wide,
			height: ((height - (height % ( width / wide ) )) / ( width / wide ) )
		}
	}

 
}