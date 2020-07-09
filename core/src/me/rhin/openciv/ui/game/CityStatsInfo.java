package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.GameOverlay;

public class CityStatsInfo extends Actor {

	private City city;

	private Sprite backgroundSprite;
	private Sprite foodIcon, productionIcon, goldIcon, scienceIcon, heritageIcon;
	private CustomLabel foodDescLabel, productionDescLabel, goldDescLabel, scienceDescLabel, heritageDescLabel;
	private CustomLabel foodLabel, productionLabel, goldLabel, scienceLabel, heritageLabel;

	public CityStatsInfo(City city, float x, float y, float width, float height) {
		this.city = city;
		this.setBounds(x, y, width, height);

		this.backgroundSprite = TextureEnum.UI_BLACK.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		float originX = x;
		float originY = Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport().getWorldHeight()
				- (GameOverlay.HEIGHT * 2 + 2);

		this.foodIcon = TextureEnum.ICON_FOOD.sprite();
		foodIcon.setSize(16, 16);
		foodIcon.setPosition(originX, originY);

		this.foodDescLabel = new CustomLabel("Food:");
		originX += foodIcon.getWidth() + 5;
		foodDescLabel.setPosition(originX, originY + foodDescLabel.getHeight() / 2);

		this.foodLabel = new CustomLabel("+0");

		originX = 5;

		this.productionIcon = TextureEnum.ICON_PRODUCTION.sprite();
		originY -= foodIcon.getHeight();
		productionIcon.setSize(16, 16);
		productionIcon.setPosition(originX, originY);

		this.productionDescLabel = new CustomLabel("Production:");
		originX += productionIcon.getWidth() + 5;
		productionDescLabel.setPosition(originX, originY + productionDescLabel.getHeight() / 2);

		this.productionLabel = new CustomLabel("+0");
		originX += productionIcon.getWidth() + 2;

		originX = 5;

		this.goldIcon = TextureEnum.ICON_GOLD.sprite();
		originY -= foodIcon.getHeight();
		goldIcon.setSize(16, 16);
		goldIcon.setPosition(originX, originY);

		this.goldDescLabel = new CustomLabel("Gold:");
		originX += goldIcon.getWidth() + 5;
		goldDescLabel.setPosition(originX, originY + goldDescLabel.getHeight() / 2);

		this.goldLabel = new CustomLabel("+0");

		originX = 5;

		this.scienceIcon = TextureEnum.ICON_RESEARCH.sprite();
		originY -= foodIcon.getHeight();
		scienceIcon.setSize(16, 16);
		scienceIcon.setPosition(originX, originY);

		this.scienceDescLabel = new CustomLabel("Science:");
		originX += scienceIcon.getWidth() + 5;
		scienceDescLabel.setPosition(originX, originY + scienceDescLabel.getHeight() / 2);

		this.scienceLabel = new CustomLabel("+0");

		originX = 5;

		this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		originY -= foodIcon.getHeight();
		heritageIcon.setSize(16, 16);
		heritageIcon.setPosition(originX, originY);

		this.heritageDescLabel = new CustomLabel("Heritage:");
		originX += heritageIcon.getWidth() + 5;
		heritageDescLabel.setPosition(originX, originY + heritageDescLabel.getHeight() / 2);

		this.heritageLabel = new CustomLabel("+0");

		updateStatValues();
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		foodIcon.draw(batch);
		productionIcon.draw(batch);
		goldIcon.draw(batch);
		scienceIcon.draw(batch);
		heritageIcon.draw(batch);

		foodDescLabel.draw(batch, parentAlpha);
		productionDescLabel.draw(batch, parentAlpha);
		goldDescLabel.draw(batch, parentAlpha);
		scienceDescLabel.draw(batch, parentAlpha);
		heritageDescLabel.draw(batch, parentAlpha);

		foodLabel.draw(batch, parentAlpha);
		productionLabel.draw(batch, parentAlpha);
		goldLabel.draw(batch, parentAlpha);
		scienceLabel.draw(batch, parentAlpha);
		heritageLabel.draw(batch, parentAlpha);
	}

	private void updateStatValues() {
		int gainedFood = (int) city.getStatLine().getStatValue(Stat.FOOD_GAIN);
		foodLabel.setText((gainedFood < 0 ? "-" : "+") + gainedFood);
		productionLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));
		goldLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.GOLD_GAIN));
		scienceLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.RESEARCH_GAIN));
		heritageLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.HERITAGE_GAIN));

		updatePositions();
	}

	private void updatePositions() {
		float originY = Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport().getWorldHeight()
				- (GameOverlay.HEIGHT * 2 + 2);
		foodLabel.setPosition(getWidth() - (foodLabel.getWidth() + 2), originY + foodDescLabel.getHeight() / 2);
		originY -= foodIcon.getHeight();
		productionLabel.setPosition(getWidth() - (productionLabel.getWidth() + 2),
				originY + foodDescLabel.getHeight() / 2);
		originY -= productionIcon.getHeight();
		goldLabel.setPosition(getWidth() - (goldLabel.getWidth() + 2), originY + foodDescLabel.getHeight() / 2);
		originY -= goldIcon.getHeight();
		scienceLabel.setPosition(getWidth() - (goldLabel.getWidth() + 2), originY + foodDescLabel.getHeight() / 2);
		originY -= scienceIcon.getHeight();
		heritageLabel.setPosition(getWidth() - (goldLabel.getWidth() + 2), originY + foodDescLabel.getHeight() / 2);
	}
}
