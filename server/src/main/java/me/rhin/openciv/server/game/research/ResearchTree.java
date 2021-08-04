package me.rhin.openciv.server.game.research;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.server.game.research.type.ArcheryTech;
import me.rhin.openciv.server.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.server.game.research.type.ConstructionTech;
import me.rhin.openciv.server.game.research.type.IronWorkingTech;
import me.rhin.openciv.server.game.research.type.MasonryTech;
import me.rhin.openciv.server.game.research.type.MathematicsTech;
import me.rhin.openciv.server.game.research.type.MiningTech;
import me.rhin.openciv.server.game.research.type.PotteryTech;
import me.rhin.openciv.server.game.research.type.SailingTech;
import me.rhin.openciv.server.game.research.type.TrappingTech;
import me.rhin.openciv.server.game.research.type.WheelTech;
import me.rhin.openciv.server.game.research.type.WritingTech;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.stat.Stat;

public class ResearchTree implements NextTurnListener {

	private Player player;
	private LinkedHashMap<Class<? extends Technology>, Technology> technologies;
	private Technology techResearching;
	private int techIDIndex;

	public ResearchTree(Player player) {
		this.player = player;
		this.technologies = new LinkedHashMap<>();
		this.techIDIndex = 0;

		// FIXME: This is going to be a crappton of techs
		technologies.put(PotteryTech.class, new PotteryTech(this));
		technologies.put(AnimalHusbandryTech.class, new AnimalHusbandryTech(this));
		technologies.put(ArcheryTech.class, new ArcheryTech(this));
		technologies.put(MiningTech.class, new MiningTech(this));
		technologies.put(SailingTech.class, new SailingTech(this));
		technologies.put(CalendarTech.class, new CalendarTech(this));
		technologies.put(WritingTech.class, new WritingTech(this));
		technologies.put(TrappingTech.class, new TrappingTech(this));
		technologies.put(WheelTech.class, new WheelTech(this));
		technologies.put(MasonryTech.class, new MasonryTech(this));
		technologies.put(BronzeWorkingTech.class, new BronzeWorkingTech(this));
		technologies.put(MathematicsTech.class, new MathematicsTech(this));
		technologies.put(ConstructionTech.class, new ConstructionTech(this));
		technologies.put(IronWorkingTech.class, new IronWorkingTech(this));

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (techResearching == null || player.getConn().isClosed())
			return;

		techResearching.applyScience(player.getStatLine().getStatValue(Stat.SCIENCE_GAIN));

		if (techResearching.getAppliedScience() >= techResearching.getScienceCost()) {
			techResearching.setResearched(true);

			CompleteResearchPacket packet = new CompleteResearchPacket();
			packet.setTech(techResearching.getID());

			Json json = new Json();
			player.getConn().send(json.toJson(packet));

			techResearching = null;
		}
	}

	public List<Technology> getTechnologies() {
		// FIXME: This seems dumb
		return new ArrayList<>(technologies.values());
	}

	public <T extends Technology> boolean hasResearched(Class<T> technologyClass) {
		return technologies.get(technologyClass).isResearched();
	}

	public Technology getTechnology(Class<? extends Technology> clazz) {
		return technologies.get(clazz);
	}

	public void chooseTech(int techID) {
		techResearching = getTechnologies().get(techID);
		System.out.println("Researching: " + techResearching.getName());
	}

	public int getCurrentTechIDIndex() {
		return techIDIndex++;
	}

	public Player getPlayerOwner() {
		return player;
	}
}
