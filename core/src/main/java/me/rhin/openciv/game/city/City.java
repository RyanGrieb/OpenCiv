package me.rhin.openciv.game.city;

import java.util.ArrayList;
import java.util.HashMap;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Timer;
import com.badlogic.gdx.utils.Timer.Task;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileObserver;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.notification.type.AvailableProductionNotification;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.production.ProducibleItemManager;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.religion.CityReligion;
import me.rhin.openciv.game.religion.PlayerReligion;
import me.rhin.openciv.game.religion.icon.ReligionIcon;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.listener.AddSpecialistToContainerListener;
import me.rhin.openciv.listener.ApplyProductionToItemListener;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.BuildingRemovedListener;
import me.rhin.openciv.listener.BuyProductionItemListener;
import me.rhin.openciv.listener.CityGainMajorityReligionListener;
import me.rhin.openciv.listener.CityLooseMajorityReligionListener;
import me.rhin.openciv.listener.CityPopulationUpdateListener;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.QueueProductionItemListener;
import me.rhin.openciv.listener.ReligionIconChangeListener;
import me.rhin.openciv.listener.RemoveSpecialistFromContainerListener;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.logging.Logger;
import me.rhin.openciv.shared.logging.LoggerFactory;
import me.rhin.openciv.shared.logging.LoggerType;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.BuildingRemovedPacket;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.CityPopulationUpdatePacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.game.TileTerritoryLines;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

//FIXME: We should have a interface for these networking interface.
public class City extends Group implements AttackableEntity, TileObserver, SpecialistContainer,
		BuildingConstructedListener, BuildingRemovedListener, CityStatUpdateListener, SetProductionItemListener,
		ApplyProductionToItemListener, FinishProductionItemListener, SetCitizenTileWorkerListener,
		AddSpecialistToContainerListener, RemoveSpecialistFromContainerListener, NextTurnListener,
		BuyProductionItemListener, CityGainMajorityReligionListener, CityLooseMajorityReligionListener,
		ReligionIconChangeListener, CityPopulationUpdateListener, QueueProductionItemListener {

	private static final Logger LOGGER = LoggerFactory.getInstance(LoggerType.LOG_TAG);

	private Tile originTile;
	private AbstractPlayer playerOwner;
	private ArrayList<Tile> territory;
	private ArrayList<Building> buildings;
	private HashMap<Tile, WorkerType> citizenWorkers;
	private TileTerritoryLines tileTerritoryLines;
	private int unemployedWorkerAmount;
	private ProducibleItemManager producibleItemManager;
	private StatLine statLine;
	private CityReligion cityReligion;
	private CustomLabel nameLabel;
	private Sprite nameIcon;
	private Sprite religionIcon;
	private Healthbar healthbar;
	private float health;
	private float maxHealth;

	public City(Tile originTile, AbstractPlayer playerOwner, String name) {
		setName(name);
		this.originTile = originTile;
		this.playerOwner = playerOwner;
		this.territory = new ArrayList<>();
		this.buildings = new ArrayList<>();
		this.citizenWorkers = new HashMap<>();
		this.tileTerritoryLines = new TileTerritoryLines(this);
		this.unemployedWorkerAmount = 0;
		this.producibleItemManager = new ProducibleItemManager(this);
		this.statLine = new StatLine();
		statLine.setValue(Stat.POPULATION, 1);
		this.cityReligion = new CityReligion(this);
		this.nameLabel = new CustomLabel(name);
		nameLabel.setPosition(originTile.getX() + originTile.getWidth() / 2 - nameLabel.getWidth() / 2,
				originTile.getY() + originTile.getHeight() + 5);

		this.nameIcon = playerOwner.getCivilization().getIcon().sprite();
		nameIcon.setBounds(nameLabel.getX() - 20, nameLabel.getY() - 4, 16, 16);

		this.healthbar = new Healthbar(nameLabel.getX() + nameLabel.getWidth() / 2 - 50 / 2, nameIcon.getY() + 15, 50,
				4, false);

		this.maxHealth = 300; // Default
		this.health = getMaxHealth();

		this.setPosition(nameLabel.getX() - 20, nameLabel.getY() - 4);
		this.setSize(nameLabel.getWidth() + 20, nameLabel.getHeight());

		Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(this);
		((InGameScreen) Civilization.getInstance().getScreenManager().getCurrentScreen()).getTerritoryGroup()
				.addActor(tileTerritoryLines);

		addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				if (!Civilization.getInstance().getWindowManager().allowsInput()) {
					return;
				}

				City cityActor = (City) event.getListenerActor();
				cityActor.onClick();
			}
		});

		Civilization.getInstance().getEventManager().addListener(BuildingConstructedListener.class, this);
		Civilization.getInstance().getEventManager().addListener(BuildingRemovedListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CityStatUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ApplyProductionToItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCitizenTileWorkerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddSpecialistToContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveSpecialistFromContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(BuyProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CityGainMajorityReligionListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CityLooseMajorityReligionListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ReligionIconChangeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CityPopulationUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(QueueProductionItemListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (!Civilization.getInstance().getWindowManager().isOpenWindow(CityInfoWindow.class)
				&& (originTile.getTileObservers().size() > 0 || !Civilization.SHOW_FOG)) {

			nameLabel.draw(batch, parentAlpha);
			nameIcon.draw(batch);
			healthbar.draw(batch, parentAlpha);

			if (religionIcon != null)
				religionIcon.draw(batch);
		}
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (health < getMaxHealth()) {
			setHealth(MathUtils.clamp(health + 5, 0, getMaxHealth()));
		}
	}

	@Override
	public void onBuildingConstructed(BuildingConstructedPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		String buildingClassName = "me.rhin.openciv.game.city.building.type."
				+ packet.getBuildingName().replaceAll(" ", "");

		try {
			Class<? extends Building> buildingClass = (Class<? extends Building>) ClassReflection
					.forName(buildingClassName);

			Building building = (Building) ClassReflection.getConstructor(buildingClass, City.class).newInstance(this);
			building.onBuilt();
			buildings.add(building);
		} catch (Exception e) {
			LOGGER.error(e.getMessage(), e);
		}

		producibleItemManager.getPossibleItems().remove(packet.getBuildingName());

		LOGGER.info("Adding building " + packet.getBuildingName() + " to city " + getName());
	}

	@Override
	public void onBuildingRemoved(BuildingRemovedPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		String buildingClassName = "me.rhin.openciv.game.city.building.type."
				+ packet.getBuildingName().replaceAll(" ", "");

		try {
			Class<? extends Building> buildingClass = (Class<? extends Building>) ClassReflection
					.forName(buildingClassName);

			Building targetBuilding = null;

			for (Building building : buildings) {
				if (building.getClass() == buildingClass) {
					targetBuilding = building;
				}
			}

			buildings.remove(targetBuilding);

		} catch (Exception e) {
			LOGGER.error(e.getMessage(), e);
		}
	}

	@Override
	public void onCityStatUpdate(CityStatUpdatePacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		setStatLine(StatLine.fromPacket(packet));
	}

	@Override
	public void onSetProductionItem(SetProductionItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		getProducibleItemManager().setCurrentProductionItem(packet.getItemName());
	}

	@Override
	public void onQueueProductionItem(QueueProductionItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		getProducibleItemManager().queueProductionItem(packet.getItemName());
	}

	@Override
	public void onApplyProductionToItem(ApplyProductionToItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		getProducibleItemManager().applyProduction(packet.getProductionAmount());
	}

	@Override
	public void onFinishProductionItem(FinishProductionItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		System.out.println("BEFORE:");
		for (ProducingItem item : producibleItemManager.getItemQueue()) {
			System.out.println(item.getProductionItem().getName());
		}
		getProducibleItemManager().getItemQueue().remove();
		System.out.println("AFTER:");
		for (ProducingItem item : producibleItemManager.getItemQueue()) {
			System.out.println(item.getProductionItem().getName());
		}

		if (getProducibleItemManager().getItemQueue().size() < 1) {
			if (playerOwner.equals(Civilization.getInstance().getGame().getPlayer()))
				Civilization.getInstance().getGame().getNotificationHanlder()
						.fireNotification(new AvailableProductionNotification(this));
		}
	}

	@Override
	public void onBuyProductionItem(BuyProductionItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		if (producibleItemManager.getCurrentProducingItem() == null)
			return;

		ProductionItem productionItem = producibleItemManager.getCurrentProducingItem().getProductionItem();

		if (productionItem.getName().equals(packet.getItemName()) && productionItem instanceof Building) {
			producibleItemManager.getItemQueue().clear();
		}
	}

	@Override
	public void onSetCitizenTileWorker(SetCitizenTileWorkerPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];

		citizenWorkers.put(tile, packet.getWorkerType());
	}

	@Override
	public void onAddSpecialistToContainer(AddSpecialistToContainerPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		ArrayList<SpecialistContainer> specialistContainers = new ArrayList<>();

		specialistContainers.add(this);

		for (Building building : buildings)
			if (building instanceof SpecialistContainer)
				specialistContainers.add((SpecialistContainer) building);

		for (SpecialistContainer contianer : specialistContainers)
			if (contianer.getName().equals(packet.getContainerName()))
				contianer.addSpecialist(packet.getAmount());
	}

	@Override
	public void onRemoveSpecialistFromContainer(RemoveSpecialistFromContainerPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		ArrayList<SpecialistContainer> specialistContainers = new ArrayList<>();

		specialistContainers.add(this);

		for (Building building : buildings)
			if (building instanceof SpecialistContainer)
				specialistContainers.add((SpecialistContainer) building);

		for (SpecialistContainer contianer : specialistContainers)
			if (contianer.getName().equals(packet.getContainerName()))
				contianer.removeSpecialist(packet.getAmount());
	}

	@Override
	public void onCityGainMajorityReligion(City city, PlayerReligion newReligion) {
		if (!city.equals(this))
			return;

		religionIcon = newReligion.getReligionIcon().getTexture().sprite();
		religionIcon.setBounds(nameLabel.getX() + nameLabel.getWidth() + 2, nameLabel.getY(), 8, 8);
	}

	@Override
	public void onCityLooseMajorityReligion(City city, PlayerReligion oldReligion) {
		if (!city.equals(this))
			return;

		religionIcon = null;
	}

	@Override
	public void onReligionIconChange(PlayerReligion religion, ReligionIcon icon) {
		if (cityReligion.getMajorityReligion() == null || !cityReligion.getMajorityReligion().equals(religion))
			return;

		religionIcon = icon.getTexture().sprite();
		religionIcon.setBounds(nameLabel.getX() + nameLabel.getWidth() + 2, nameLabel.getY(), 8, 8);
	}

	@Override
	public void onCityPopulationUpdate(CityPopulationUpdatePacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		statLine.setValue(Stat.POPULATION, packet.getPopulation());
	}

	@Override
	public void addSpecialist(int amount) {
		if (amount == -1) {
			unemployedWorkerAmount = 0;
			LOGGER.debug("Clear unemployed specialist");
		} else {
			unemployedWorkerAmount += amount;
			LOGGER.debug("Add unemployed specialist");
		}
	}

	@Override
	public void removeSpecialist(int amount) {
		if (amount == -1) {
			unemployedWorkerAmount = 0;
			LOGGER.debug("Clear unemployed specialist");
		} else {
			unemployedWorkerAmount -= amount;
			LOGGER.debug("Remove unemployed specialist");
		}
	}

	@Override
	public int getSpecialistSlots() {
		return Integer.MAX_VALUE;
	}

	@Override
	public SpecialistType getSpecialistType() {
		return SpecialistType.UNEMPLOYED;
	}

	@Override
	public void flashColor(Color color) {
		originTile.setColor(color.r / 2, color.g / 2, color.b / 2, 1);

		float delay = 0.25F; // seconds

		Timer.schedule(new Task() {
			@Override
			public void run() {
				originTile.setColor(Color.WHITE);
			}
		}, delay);
	}

	@Override
	public boolean isUnitCapturable() {
		return false;
	}

	@Override
	public void setHealth(float health) {

		if (health <= 0)
			health = 1;

		this.health = health;
		this.healthbar.setHealth(getMaxHealth(), health);
	}

	@Override
	public void setMaxHealth(float maxHealth) {
		this.maxHealth = maxHealth;

		this.healthbar.setHealth(getMaxHealth(), health);
	}

	@Override
	public float getHealth() {
		return health;
	}

	@Override
	public float getMaxHealth() {
		return maxHealth;
	}

	@Override
	public Tile getTile() {
		return originTile;
	}

	@Override
	public boolean ignoresTileObstructions() {
		return false;
	}

	@Override
	public void setIgnoresTileObstructions(boolean ignoresTileObstructions) {
		// Doesn't include cities
	}

	@Override
	public int getID() {
		return -1;
	}

	public void setOwner(AbstractPlayer playerOwner) {

		this.playerOwner = playerOwner;

		this.nameIcon = playerOwner.getCivilization().getIcon().sprite();
		nameIcon.setBounds(nameLabel.getX() - 20, nameLabel.getY() - 4, 16, 16);

		if (!playerOwner.equals(Civilization.getInstance().getGame().getPlayer())) {
			for (Tile tile : territory)
				tile.removeTileObserver(this);
			originTile.removeTileObserver(this);
		}

		for (Tile tile : territory) {
			tile.setTerritory(this);
		}
	}

	public void onClick() {
		if (!playerOwner.equals(Civilization.getInstance().getGame().getPlayer())
				|| Civilization.getInstance().getWindowManager().isOpenWindow(CityInfoWindow.class))
			return;

		Civilization.getInstance().getScreenManager().getCurrentScreen().setCameraPosition(
				originTile.getX() + originTile.getWidth() / 2, originTile.getY() + originTile.getHeight() / 2);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();
		Civilization.getInstance().getWindowManager().toggleWindow(new CityInfoWindow(this));

		Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.CITY_CLICK);
	}

	public void setStatLine(StatLine statLine) {
		this.statLine = statLine;
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public ArrayList<Building> getBuildings() {
		return buildings;
	}

	public void growTerritory(Tile tile) {
		for (Tile adjTile : territory)
			adjTile.clearBorders();

		tile.setTerritory(this);
		territory.add(tile);

		for (Tile adjTile : territory)
			adjTile.defineBorders();
	}

	public ArrayList<Tile> getTerritory() {
		return territory;
	}

	public AbstractPlayer getPlayerOwner() {
		return playerOwner;
	}

	public ProducibleItemManager getProducibleItemManager() {
		return producibleItemManager;
	}

	public HashMap<Tile, WorkerType> getCitizenWorkers() {
		return citizenWorkers;
	}

	public int getUnemployedWorkerAmount() {
		return unemployedWorkerAmount;
	}

	public boolean isCoastal() {
		for (Tile tile : originTile.getAdjTiles())
			if (tile.containsTileProperty(TileProperty.WATER))
				return true;

		return false;
	}

	public boolean containsBuilding(Class<? extends Building> clazz) {
		for (Building building : buildings)
			if (building.getClass() == clazz)
				return true;
		return false;
	}

	public CityReligion getCityReligion() {
		return cityReligion;
	}
}
