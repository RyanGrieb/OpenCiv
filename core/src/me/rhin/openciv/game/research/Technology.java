package me.rhin.openciv.game.research;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;

public abstract class Technology implements NextTurnListener, CompleteResearchListener {

	private static int techIDS = 0;

	protected ArrayList<Class<? extends Technology>> requiredTechs;

	private boolean researched;
	private int id;
	private boolean researching;
	private float appliedScience;
	private int appliedTurns;

	public Technology() {
		this.requiredTechs = new ArrayList<>();
		this.researched = false;
		this.id = techIDS++;
		this.researching = false;
		this.appliedScience = 0;
		this.appliedTurns = 0;

		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
	}

	public static Technology fromID(int techID) {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies().get(techID);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (researching) {
			appliedScience += Civilization.getInstance().getGame().getPlayer().getStatLine()
					.getStatValue(Stat.SCIENCE_GAIN);
			appliedTurns++;
		}
	}

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		if (packet.getTechID() != id)
			return;

		researched = true;
		researching = false;
	}

	public abstract int getScienceCost();

	public abstract String getName();

	public abstract Sprite getIcon();

	public abstract String getDesc();

	public boolean isResearched() {
		return researched;
	}

	public ArrayList<Class<? extends Technology>> getRequiredTechs() {
		return requiredTechs;
	}

	public boolean hasResearchedRequiredTechs() {
		for (Class<? extends Technology> techClazz : requiredTechs) {
			Technology tech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.getTechnology(techClazz);

			if (!tech.isResearched())
				return false;
		}

		return true;
	}

	public int getID() {
		return id;
	}

	public void setResearching(boolean researching) {
		this.researching = researching;
	}

	public boolean isResearching() {
		return researching;
	}

	public float getAppliedScience() {
		return appliedScience;
	}

	public int getAppliedTurns() {
		return appliedTurns;
	}
}
