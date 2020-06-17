package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CityInfoWindow extends AbstractWindow {

	private City city;
	private Sprite foodIcon, productionIcon, goldIcon, scienceIcon, heritageIcon;
	private CustomLabel foodLabel, productionLabel, goldLabel, scienceLabel, heritageLabel;

	public CityInfoWindow(City city) {
		this.city = city;

		float originX = viewport.getWorldWidth() - 300;

		BlankBackground blankBackground = new BlankBackground(originX, 0, 300, 100);
		addActor(blankBackground);

		CustomLabel cityNameLabel = new CustomLabel(city.getName(), Align.center, originX, 100 - 20, 300, 20);
		addActor(cityNameLabel);

		this.foodIcon = TextureEnum.ICON_FOOD.sprite();
		foodIcon.setSize(16, 16);
		originX += 7;
		foodIcon.setPosition(originX, 100 - 38);

		this.foodLabel = new CustomLabel("+0.0");
		originX += foodIcon.getWidth() + 2;
		foodLabel.setPosition(originX, 100 - 33);
		addActor(foodLabel);

		this.productionIcon = TextureEnum.ICON_PRODUCTION.sprite();
		productionIcon.setSize(16, 16);
		originX += foodLabel.getWidth() + 5;
		productionIcon.setPosition(originX, 100 - 38);

		this.productionLabel = new CustomLabel("+0.0");
		originX += productionIcon.getWidth() + 2;
		productionLabel.setPosition(originX, 100 - 33);
		addActor(productionLabel);

		this.goldIcon = TextureEnum.ICON_GOLD.sprite();
		goldIcon.setSize(16, 16);
		originX += productionLabel.getWidth() + 5;
		goldIcon.setPosition(originX, 100 - 38);

		this.goldLabel = new CustomLabel("+0.0");
		originX += goldIcon.getWidth() + 2;
		goldLabel.setPosition(originX, 100 - 33);
		addActor(goldLabel);
		
		this.scienceIcon = TextureEnum.ICON_RESEARCH.sprite();
		scienceIcon.setSize(16, 16);
		originX += productionLabel.getWidth() + 5;
		scienceIcon.setPosition(originX, 100 - 38);

		this.scienceLabel = new CustomLabel("+0.0");
		originX += scienceIcon.getWidth() + 2;
		scienceLabel.setPosition(originX, 100 - 33);
		addActor(scienceLabel);
		
		this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		heritageIcon.setSize(16, 16);
		originX += productionLabel.getWidth() + 5;
		heritageIcon.setPosition(originX, 100 - 38);

		this.heritageLabel = new CustomLabel("+0.0");
		originX += heritageIcon.getWidth() + 2;
		heritageLabel.setPosition(originX, 100 - 33);
		addActor(heritageLabel);
	}

	@Override
	public void draw() {
		super.draw();
		Batch batch = getBatch();
		batch.begin();
		foodIcon.draw(batch);
		productionIcon.draw(batch);
		goldIcon.draw(batch);
		scienceIcon.draw(batch);
		heritageIcon.draw(batch);
		batch.end();
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

}
