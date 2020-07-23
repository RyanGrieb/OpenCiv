package me.rhin.openciv.game.city;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.production.ProducibleItemManager;
import me.rhin.openciv.listener.ApplyProductionToItemListener;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.listener.SetWorkedTileListener;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetWorkedTilePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

public class City extends Actor implements BuildingConstructedListener, CityStatUpdateListener,
		SetProductionItemListener, ApplyProductionToItemListener, FinishProductionItemListener, SetWorkedTileListener {

	private Tile originTile;
	private Player playerOwner;
	private ArrayList<Tile> territory;
	private ArrayList<Building> buildings;
	private ArrayList<Tile> workedTiles;
	private ProducibleItemManager producibleItemManager;
	private StatLine statLine;
	private CustomLabel nameLabel;

	public City(Tile originTile, Player playerOwner, String name) {
		this.originTile = originTile;
		this.playerOwner = playerOwner;
		this.territory = new ArrayList<>();
		this.buildings = new ArrayList<>();
		this.workedTiles = new ArrayList<>();
		this.producibleItemManager = new ProducibleItemManager(this);
		this.statLine = new StatLine();
		setName(name);
		this.nameLabel = new CustomLabel(name);
		nameLabel.setPosition(originTile.getX() + originTile.getWidth() / 2 - nameLabel.getWidth() / 2,
				originTile.getY() + originTile.getHeight() + 5);

		// FIXME: The actor size & position really shouldn't be confined to the label.
		this.setPosition(nameLabel.getX(), nameLabel.getY());
		this.setSize(nameLabel.getWidth(), nameLabel.getHeight());

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
		Civilization.getInstance().getEventManager().addListener(SetWorkedTileListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (!Civilization.getInstance().getWindowManager().isOpenWindow(CityInfoWindow.class))
			nameLabel.draw(batch, parentAlpha);
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
	public void onSetWorkedTile(SetWorkedTilePacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		workedTiles.add(Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()]);
	}

	public void onRemoveWorkedTile(RemoveWorkedTilePacket packet) {
		if (!getName().equals(packet.getCityName()))
			return;

		for (Tile workedTile : workedTiles) {
			if (workedTile.equals(
					Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()]))
				workedTiles.remove(workedTile);
		}
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

	public ArrayList<Tile> getWorkedTiles() {
		return workedTiles;
	}

	public Tile getOriginTile() {
		return originTile;
	}
}
