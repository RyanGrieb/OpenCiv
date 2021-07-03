package me.rhin.openciv.game.city;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileObserver;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.production.ProducibleItemManager;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.listener.AddSpecialistToContainerListener;
import me.rhin.openciv.listener.ApplyProductionToItemListener;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.RemoveSpecialistFromContainerListener;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.shared.city.SpecialistType;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

//FIXME: We should have a interface for these networking interface.
public class City extends Group implements AttackableEntity, TileObserver, SpecialistContainer,
		BuildingConstructedListener, CityStatUpdateListener, SetProductionItemListener, ApplyProductionToItemListener,
		FinishProductionItemListener, SetCitizenTileWorkerListener, AddSpecialistToContainerListener,
		RemoveSpecialistFromContainerListener, NextTurnListener {

	private Tile originTile;
	private Player playerOwner;
	private ArrayList<Tile> territory;
	private ArrayList<Building> buildings;
	private HashMap<Tile, WorkerType> citizenWorkers;
	private int unemployedWorkerAmount;
	private ProducibleItemManager producibleItemManager;
	private StatLine statLine;
	private CustomLabel nameLabel;
	private Sprite nameIcon;
	private Healthbar healthbar;
	private float health;

	public City(Tile originTile, Player playerOwner, String name) {
		this.originTile = originTile;
		this.playerOwner = playerOwner;
		this.territory = new ArrayList<>();
		this.buildings = new ArrayList<>();
		this.citizenWorkers = new HashMap<>();
		this.unemployedWorkerAmount = 0;
		this.producibleItemManager = new ProducibleItemManager(this);
		this.statLine = new StatLine();
		setName(name);
		this.nameLabel = new CustomLabel(name);
		nameLabel.setPosition(originTile.getX() + originTile.getWidth() / 2 - nameLabel.getWidth() / 2,
				originTile.getY() + originTile.getHeight() + 5);

		this.nameIcon = playerOwner.getCivType().getIcon().sprite();
		nameIcon.setBounds(nameLabel.getX() - 20, nameLabel.getY() - 4, 16, 16);

		// FIXME: We really should have the city behave as a group, rather than an
		// actor...
		this.healthbar = new Healthbar(nameLabel.getX() + nameLabel.getWidth() / 2 - 50 / 2, nameIcon.getY() + 15, 50,
				4, false);
		this.health = getMaxHealth();

		// FIXME: The actor size & position really shouldn't be confined to the label.
		this.setPosition(nameLabel.getX() - 20, nameLabel.getY() - 4);
		this.setSize(nameLabel.getWidth() + 20, nameLabel.getHeight());

		Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(this);
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
		Civilization.getInstance().getEventManager().addListener(CityStatUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ApplyProductionToItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCitizenTileWorkerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddSpecialistToContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveSpecialistFromContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (!Civilization.getInstance().getWindowManager().isOpenWindow(CityInfoWindow.class)
				&& originTile.getTileObservers().size() > 0) {
			// FIXME: Since we are a group now, we don't need to override draw.
			nameLabel.draw(batch, parentAlpha);
			nameIcon.draw(batch);
			healthbar.draw(batch, parentAlpha);
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

		String buildingClassName = "me.rhin.openciv.game.city.building.type." + packet.getBuildingName();
		try {
			Class<? extends Building> buildingClass = (Class<? extends Building>) ClassReflection
					.forName(buildingClassName);

			// Constructor<?> ctor = buildingClass.getConstructor(City.class);
			// Building building = (Building) ctor.newInstance(new Object[] { this });
			Building building = (Building) ClassReflection.getConstructor(buildingClass, City.class).newInstance(this);
			buildings.add(building);
		} catch (Exception e) {
			Gdx.app.log(Civilization.WS_LOG_TAG, e.getMessage());
			e.printStackTrace();
		}

		producibleItemManager.getPossibleItems().remove(packet.getBuildingName());

		Gdx.app.log(Civilization.LOG_TAG, "Adding building " + packet.getBuildingName() + " to city " + getName());
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
	public void onApplyProductionToItem(ApplyProductionToItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		getProducibleItemManager().applyProduction(packet.getProductionAmount());
	}

	@Override
	public void onFinishProductionItem(FinishProductionItemPacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		getProducibleItemManager().getItemQueue().clear();
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
	public void addSpecialist(int amount) {
		if (amount == -1) {
			unemployedWorkerAmount = 0;
		} else
			unemployedWorkerAmount += amount;
	}

	@Override
	public void removeSpecialist(int amount) {
		if (amount == -1)
			unemployedWorkerAmount = 0;
		else
			unemployedWorkerAmount -= amount;
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
	public void flashColor(Color red) {
		originTile.setColor(red.r / 2, red.g / 2, red.b / 2, 1);

		final ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(2);
		executor.schedule(new Runnable() {
			@Override
			public void run() {
				originTile.setColor(Color.WHITE);
			}
		}, 250, TimeUnit.MILLISECONDS);

	}

	@Override
	public int getCombatStrength() {
		return 5;
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
	public float getHealth() {
		return health;
	}

	@Override
	public float getMaxHealth() {
		return 200;
	}

	@Override
	public Tile getTile() {
		return originTile;
	}

	public void setOwner(Player playerOwner) {
		this.playerOwner = playerOwner;

		this.nameIcon = playerOwner.getCivType().getIcon().sprite();
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

	public Player getPlayerOwner() {
		return playerOwner;
	}

	public ProducibleItemManager getProducibleItemManager() {
		return producibleItemManager;
	}

	public HashMap<Tile, WorkerType> getCitizenWorkers() {
		return citizenWorkers;
	}

	// FIXME: Have getTile() replace this redundant method.
	public Tile getOriginTile() {
		return originTile;
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
}
