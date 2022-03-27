package me.rhin.openciv.ui.game;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.util.MathHelper;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityStatsInfo extends Actor implements Listener {

	private City city;

	private Sprite backgroundSprite;
	private Sprite populationIcon, foodIcon, productionIcon, goldIcon, scienceIcon, heritageIcon, moraleIcon;
	private CustomLabel populationDescLabel, populationGrowthDescLabel, foodDescLabel, productionDescLabel,
			goldDescLabel, scienceDescLabel, heritageDescLabel, borderGrowthDescLabel, moraleDescLabel;
	private CustomLabel populationLabel, populationGrowthLabel, foodLabel, productionLabel, goldLabel, scienceLabel,
			heritageLabel, borderGrowthLabel, moraleLabel;

	public CityStatsInfo(City city, float x, float y, float width, float height) {
		this.city = city;
		this.setBounds(x, y, width, height);

		this.backgroundSprite = TextureEnum.UI_POPUP_BOX_B.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		this.populationIcon = TextureEnum.ICON_CITIZEN.sprite();
		populationIcon.setSize(16, 16);

		this.populationDescLabel = new CustomLabel("Citizens:");
		this.populationLabel = new CustomLabel("0");
		this.populationGrowthDescLabel = new CustomLabel("Growth In:");
		this.populationGrowthLabel = new CustomLabel("0 Turns");

		this.foodIcon = TextureEnum.ICON_FOOD.sprite();
		foodIcon.setSize(16, 16);

		this.foodDescLabel = new CustomLabel("Food:");
		this.foodLabel = new CustomLabel("+0");

		this.productionIcon = TextureEnum.ICON_PRODUCTION.sprite();
		productionIcon.setSize(16, 16);

		this.productionDescLabel = new CustomLabel("Production:");
		this.productionLabel = new CustomLabel("+0");

		this.goldIcon = TextureEnum.ICON_GOLD.sprite();
		goldIcon.setSize(16, 16);

		this.goldDescLabel = new CustomLabel("Gold:");
		this.goldLabel = new CustomLabel("+0");

		this.scienceIcon = TextureEnum.ICON_SCIENCE.sprite();
		scienceIcon.setSize(16, 16);

		this.scienceDescLabel = new CustomLabel("Science:");
		this.scienceLabel = new CustomLabel("+0");

		this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		heritageIcon.setSize(16, 16);

		this.heritageDescLabel = new CustomLabel("Heritage:");
		this.heritageLabel = new CustomLabel("+0");

		this.moraleIcon = TextureEnum.ICON_MORALE.sprite();
		moraleIcon.setSize(16, 16);

		this.moraleDescLabel = new CustomLabel("Morale:");
		this.moraleLabel = new CustomLabel("100%");
		this.borderGrowthDescLabel = new CustomLabel("Expansion In:");
		this.borderGrowthLabel = new CustomLabel("0 Turns");

		updateStatValues();

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		populationIcon.draw(batch);
		foodIcon.draw(batch);
		productionIcon.draw(batch);
		goldIcon.draw(batch);
		scienceIcon.draw(batch);
		heritageIcon.draw(batch);
		moraleIcon.draw(batch);

		populationDescLabel.draw(batch, parentAlpha);
		populationGrowthDescLabel.draw(batch, parentAlpha);
		foodDescLabel.draw(batch, parentAlpha);
		productionDescLabel.draw(batch, parentAlpha);
		goldDescLabel.draw(batch, parentAlpha);
		scienceDescLabel.draw(batch, parentAlpha);
		heritageDescLabel.draw(batch, parentAlpha);
		moraleDescLabel.draw(batch, parentAlpha);
		borderGrowthDescLabel.draw(batch, parentAlpha);

		populationLabel.draw(batch, parentAlpha);
		populationGrowthLabel.draw(batch, parentAlpha);
		foodLabel.draw(batch, parentAlpha);
		productionLabel.draw(batch, parentAlpha);
		goldLabel.draw(batch, parentAlpha);
		scienceLabel.draw(batch, parentAlpha);
		heritageLabel.draw(batch, parentAlpha);
		moraleLabel.draw(batch, parentAlpha);
		borderGrowthLabel.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		updatePositions();
	}

	@EventHandler
	public void onCityStatUpdate(CityStatUpdatePacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateStatValues();
	}

	private void updateStatValues() {
		Gdx.app.postRunnable(new Runnable() {
			@Override
			public void run() {

				int gainedFood = (int) (city.getStatLine().getStatValue(Stat.FOOD_GAIN)
						- (city.getStatLine().getStatValue(Stat.POPULATION) * 2));
				populationLabel.setText((int) city.getStatLine().getStatValue(Stat.POPULATION));

				int surplusFood = (int) city.getStatLine().getStatValue(Stat.FOOD_SURPLUS);
				int population = (int) city.getStatLine().getStatValue(Stat.POPULATION);
				int foodRequired = (int) (15 + 8 * (population - 1) + Math.pow(population - 1, 1.5));

				int growthTurns = (foodRequired - surplusFood) / MathHelper.nonZero(gainedFood);

				if (gainedFood < 0) {
					int starvingTurns = (surplusFood / Math.abs(gainedFood)) + 1;
					populationGrowthLabel.setText(starvingTurns + (starvingTurns > 1 ? " Turns" : " Turn"));
					populationGrowthDescLabel.setText("Starve In: ");

				} else if (gainedFood == 0) {
					populationGrowthLabel.setText("Stagnated");
					populationGrowthDescLabel.setText("Growth: ");
				} else {
					populationGrowthLabel.setText(growthTurns + (growthTurns > 1 ? " Turns" : " Turn"));
					populationGrowthDescLabel.setText("Growth In: ");
				}

				foodLabel.setText((gainedFood < 0 ? "" : "+") + gainedFood);
				productionLabel
						.setText("+" + MathHelper.roundDec(city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)));
				goldLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.GOLD_GAIN));
				scienceLabel.setText("+" + city.getStatLine().getStatValue(Stat.SCIENCE_GAIN));
				heritageLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.HERITAGE_GAIN));
				moraleLabel.setText((int) city.getStatLine().getStatValue(Stat.MORALE_CITY) + "%");

				int expansionTurns = (int) Math.ceil(((city.getStatLine().getStatValue(Stat.EXPANSION_REQUIREMENT)
						- city.getStatLine().getStatValue(Stat.EXPANSION_PROGRESS))
						/ city.getStatLine().getStatValue(Stat.HERITAGE_GAIN)));

				borderGrowthLabel.setText(expansionTurns + (expansionTurns > 1 ? " Turns" : " Turn"));

				updatePositions();
			}
		});
	}

	private void updatePositions() {
		float originX = 7;
		float originY = backgroundSprite.getY() + backgroundSprite.getHeight() - 22;

		// Population information
		populationIcon.setPosition(originX, originY);
		this.populationDescLabel = new CustomLabel("Citizens:");
		originX += populationIcon.getWidth() + 5;
		populationDescLabel.setPosition(originX, originY + populationDescLabel.getHeight() / 2);
		originX = 7;
		populationLabel.setPosition(getWidth() - (populationLabel.getWidth() + 4),
				originY + populationDescLabel.getHeight() / 2);
		originY -= populationIcon.getHeight() + 3;

		// Population growth information
		populationGrowthDescLabel.setPosition(originX, originY + populationGrowthDescLabel.getHeight() / 2);
		originX = 7;
		populationGrowthLabel.setPosition(getWidth() - (populationGrowthLabel.getWidth() + 4),
				originY + populationGrowthDescLabel.getHeight() / 2);
		originY -= populationIcon.getHeight();

		// Food information
		foodIcon.setPosition(originX, originY);
		originX += foodIcon.getWidth() + 5;
		foodDescLabel.setPosition(originX, originY + foodDescLabel.getHeight() / 2);
		originX = 7;
		foodLabel.setPosition(getWidth() - (foodLabel.getWidth() + 4), originY + foodDescLabel.getHeight() / 2);
		originY -= foodIcon.getHeight();

		// Production information
		productionIcon.setPosition(originX, originY);
		originX += productionIcon.getWidth() + 5;
		productionDescLabel.setPosition(originX, originY + productionDescLabel.getHeight() / 2);
		originX = 7;
		productionLabel.setPosition(getWidth() - (productionLabel.getWidth() + 4),
				originY + productionDescLabel.getHeight() / 2);
		originY -= productionIcon.getHeight();

		// Gold information
		goldIcon.setPosition(originX, originY);
		originX += productionIcon.getWidth() + 5;
		goldDescLabel.setPosition(originX, originY + goldDescLabel.getHeight() / 2);
		originX = 7;
		goldLabel.setPosition(getWidth() - (goldLabel.getWidth() + 4), originY + goldDescLabel.getHeight() / 2);
		originY -= goldIcon.getHeight();

		// Science information
		scienceIcon.setPosition(originX, originY);
		originX += scienceIcon.getWidth() + 5;
		scienceDescLabel.setPosition(originX, originY + scienceDescLabel.getHeight() / 2);
		originX = 7;
		scienceLabel.setPosition(getWidth() - (scienceLabel.getWidth() + 4),
				originY + scienceDescLabel.getHeight() / 2);
		originY -= scienceIcon.getHeight();

		// Heritage information
		heritageIcon.setPosition(originX, originY);
		originX += heritageIcon.getWidth() + 5;
		heritageDescLabel.setPosition(originX, originY + heritageDescLabel.getHeight() / 2);
		originX = 7;
		heritageLabel.setPosition(getWidth() - (heritageLabel.getWidth() + 4),
				originY + heritageDescLabel.getHeight() / 2);
		originY -= heritageIcon.getHeight();

		// Morale information
		moraleIcon.setPosition(originX, originY);
		originX += moraleIcon.getWidth() + 5;
		moraleDescLabel.setPosition(originX, originY + moraleDescLabel.getHeight() / 2);
		originX = 7;
		moraleLabel.setPosition(getWidth() - (moraleLabel.getWidth() + 4), originY + moraleDescLabel.getHeight() / 2);
		originY -= moraleIcon.getHeight() + 3;

		// Border growth information
		borderGrowthDescLabel.setPosition(originX, originY + borderGrowthDescLabel.getHeight() / 2);
		borderGrowthLabel.setPosition(getWidth() - (borderGrowthLabel.getWidth() + 4),
				originY + foodDescLabel.getHeight() / 2);
	}
}
