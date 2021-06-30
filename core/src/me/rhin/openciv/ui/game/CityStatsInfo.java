package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.util.MathHelper;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.GameOverlay;

public class CityStatsInfo extends Actor implements CityStatUpdateListener {

	private City city;

	private Sprite backgroundSprite;
	private Sprite populationIcon, foodIcon, productionIcon, goldIcon, scienceIcon, heritageIcon;
	private CustomLabel populationDescLabel, populationGrowthDescLabel, foodDescLabel, productionDescLabel,
			goldDescLabel, scienceDescLabel, heritageDescLabel, borderGrowthDescLabel;
	private CustomLabel populationLabel, populationGrowthLabel, foodLabel, productionLabel, goldLabel, scienceLabel,
			heritageLabel, borderGrowthLabel;

	public CityStatsInfo(City city, float x, float y, float width, float height) {
		this.city = city;
		this.setBounds(x, y, width, height);

		this.backgroundSprite = TextureEnum.UI_BLACK.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		float originX = 5;
		float originY = backgroundSprite.getY() + backgroundSprite.getHeight() - 20;

		this.populationIcon = TextureEnum.ICON_CITIZEN.sprite();
		populationIcon.setSize(16, 16);
		populationIcon.setPosition(originX, originY);

		this.populationDescLabel = new CustomLabel("Citizens:");
		originX += populationIcon.getWidth() + 5;
		populationDescLabel.setPosition(originX, originY + populationDescLabel.getHeight() / 2);

		this.populationLabel = new CustomLabel("0");

		originX = 5;
		originY -= populationIcon.getHeight() + 3;

		this.populationGrowthDescLabel = new CustomLabel("Growth In:");
		populationGrowthDescLabel.setPosition(originX, originY + populationGrowthDescLabel.getHeight() / 2);

		this.populationGrowthLabel = new CustomLabel("0 Turns");

		originX = 5;

		this.foodIcon = TextureEnum.ICON_FOOD.sprite();
		originY -= populationIcon.getHeight();
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
		originY -= productionIcon.getHeight();
		goldIcon.setSize(16, 16);
		goldIcon.setPosition(originX, originY);

		this.goldDescLabel = new CustomLabel("Gold:");
		originX += goldIcon.getWidth() + 5;
		goldDescLabel.setPosition(originX, originY + goldDescLabel.getHeight() / 2);

		this.goldLabel = new CustomLabel("+0");

		originX = 5;

		this.scienceIcon = TextureEnum.ICON_SCIENCE.sprite();
		originY -= goldIcon.getHeight();
		scienceIcon.setSize(16, 16);
		scienceIcon.setPosition(originX, originY);

		this.scienceDescLabel = new CustomLabel("Science:");
		originX += scienceIcon.getWidth() + 5;
		scienceDescLabel.setPosition(originX, originY + scienceDescLabel.getHeight() / 2);

		this.scienceLabel = new CustomLabel("+0");

		originX = 5;

		this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		originY -= scienceIcon.getHeight();
		heritageIcon.setSize(16, 16);
		heritageIcon.setPosition(originX, originY);

		this.heritageDescLabel = new CustomLabel("Heritage:");
		originX += heritageIcon.getWidth() + 5;
		heritageDescLabel.setPosition(originX, originY + heritageDescLabel.getHeight() / 2);

		this.heritageLabel = new CustomLabel("+0");

		originX = 5;

		originY -= heritageIcon.getHeight() + 3;
		this.borderGrowthDescLabel = new CustomLabel("Expansion In:");
		borderGrowthDescLabel.setPosition(originX, originY + borderGrowthDescLabel.getHeight() / 2);

		this.borderGrowthLabel = new CustomLabel("0 Turns");

		updateStatValues();

		Civilization.getInstance().getEventManager().addListener(CityStatUpdateListener.class, this);
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

		populationDescLabel.draw(batch, parentAlpha);
		populationGrowthDescLabel.draw(batch, parentAlpha);
		foodDescLabel.draw(batch, parentAlpha);
		productionDescLabel.draw(batch, parentAlpha);
		goldDescLabel.draw(batch, parentAlpha);
		scienceDescLabel.draw(batch, parentAlpha);
		heritageDescLabel.draw(batch, parentAlpha);
		borderGrowthDescLabel.draw(batch, parentAlpha);

		populationLabel.draw(batch, parentAlpha);
		populationGrowthLabel.draw(batch, parentAlpha);
		foodLabel.draw(batch, parentAlpha);
		productionLabel.draw(batch, parentAlpha);
		goldLabel.draw(batch, parentAlpha);
		scienceLabel.draw(batch, parentAlpha);
		heritageLabel.draw(batch, parentAlpha);
		borderGrowthLabel.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		updatePositions();
	}

	@Override
	public void onCityStatUpdate(CityStatUpdatePacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateStatValues();
	}

	private void updateStatValues() {
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
		productionLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));
		goldLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.GOLD_GAIN));
		scienceLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.SCIENCE_GAIN));
		heritageLabel.setText("+" + (int) city.getStatLine().getStatValue(Stat.HERITAGE_GAIN));

		int expansionTurns = (int) Math.ceil(((city.getStatLine().getStatValue(Stat.EXPANSION_REQUIREMENT)
				- city.getStatLine().getStatValue(Stat.HERITAGE))
				/ city.getStatLine().getStatValue(Stat.HERITAGE_GAIN)));

		borderGrowthLabel.setText(expansionTurns + (expansionTurns > 1 ? " Turns" : " Turn"));

		updatePositions();
	}

	private void updatePositions() {
		float originX = 5;
		float originY = backgroundSprite.getY() + backgroundSprite.getHeight() - 20;

		//Population information
		populationIcon.setPosition(originX, originY);
		this.populationDescLabel = new CustomLabel("Citizens:");
		originX += populationIcon.getWidth() + 5;
		populationDescLabel.setPosition(originX, originY + populationDescLabel.getHeight() / 2);
		originX = 5;
		populationLabel.setPosition(getWidth() - (populationLabel.getWidth() + 2),
				originY + populationDescLabel.getHeight() / 2);
		originY -= populationIcon.getHeight() + 3;

		//Population growth information
		populationGrowthDescLabel.setPosition(originX, originY + populationGrowthDescLabel.getHeight() / 2);
		originX = 5;
		populationGrowthLabel.setPosition(getWidth() - (populationGrowthLabel.getWidth() + 2),
				originY + populationGrowthDescLabel.getHeight() / 2);
		originY -= populationIcon.getHeight();
		
		//Food information
		foodIcon.setPosition(originX, originY);
		originX += foodIcon.getWidth() + 5;
		foodDescLabel.setPosition(originX, originY + foodDescLabel.getHeight() / 2);
		originX = 5;
		foodLabel.setPosition(getWidth() - (foodLabel.getWidth() + 2), originY + foodDescLabel.getHeight() / 2);
		originY -= foodIcon.getHeight();
		
		//Production information
		productionIcon.setPosition(originX, originY);
		originX += productionIcon.getWidth() + 5;
		productionDescLabel.setPosition(originX, originY + productionDescLabel.getHeight() / 2);
		originX = 5;
		productionLabel.setPosition(getWidth() - (productionLabel.getWidth() + 2),
				originY + productionDescLabel.getHeight() / 2);
		originY -= productionIcon.getHeight();
		
		//Gold information
		goldIcon.setPosition(originX, originY);
		originX += productionIcon.getWidth() + 5;
		goldDescLabel.setPosition(originX, originY + goldDescLabel.getHeight() / 2);
		originX = 5;
		goldLabel.setPosition(getWidth() - (goldLabel.getWidth() + 2), originY + goldDescLabel.getHeight() / 2);
		originY -= goldIcon.getHeight();
		
		//Science information
		scienceIcon.setPosition(originX, originY);
		originX += scienceIcon.getWidth() + 5;
		scienceDescLabel.setPosition(originX, originY + scienceDescLabel.getHeight() / 2);
		originX = 5;
		scienceLabel.setPosition(getWidth() - (scienceLabel.getWidth() + 2),
				originY + scienceDescLabel.getHeight() / 2);
		originY -= scienceIcon.getHeight();
		
		//Heritage information
		heritageIcon.setPosition(originX, originY);
		originX += heritageIcon.getWidth() + 5;
		heritageDescLabel.setPosition(originX, originY + heritageDescLabel.getHeight() / 2);
		originX = 5;
		heritageLabel.setPosition(getWidth() - (heritageLabel.getWidth() + 2),
				originY + heritageDescLabel.getHeight() / 2);
		originY -= heritageIcon.getHeight() + 3;
			
		//Border growth information
		borderGrowthDescLabel.setPosition(originX, originY + borderGrowthDescLabel.getHeight() / 2);
		borderGrowthLabel.setPosition(getWidth() - (borderGrowthLabel.getWidth() + 2),
				originY + foodDescLabel.getHeight() / 2);
	}
}
