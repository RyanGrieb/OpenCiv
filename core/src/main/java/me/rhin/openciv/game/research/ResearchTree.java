package me.rhin.openciv.game.research;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.research.type.ArcheryTech;
import me.rhin.openciv.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.game.research.type.ConstructionTech;
import me.rhin.openciv.game.research.type.HorsebackRridingTech;
import me.rhin.openciv.game.research.type.IronWorkingTech;
import me.rhin.openciv.game.research.type.MasonryTech;
import me.rhin.openciv.game.research.type.MathematicsTech;
import me.rhin.openciv.game.research.type.MiningTech;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.game.research.type.SailingTech;
import me.rhin.openciv.game.research.type.TrappingTech;
import me.rhin.openciv.game.research.type.WheelTech;
import me.rhin.openciv.game.research.type.WritingTech;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.PickResearchListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;

public class ResearchTree implements PickResearchListener, CompleteResearchListener {

	private LinkedHashMap<Class<? extends Technology>, Technology> technologies;
	private Technology researchingTech;

	public ResearchTree() {
		this.technologies = new LinkedHashMap<>();

		// FIXME: This is going to be a crappton of techs
		technologies.put(PotteryTech.class, new PotteryTech());
		technologies.put(AnimalHusbandryTech.class, new AnimalHusbandryTech());
		technologies.put(ArcheryTech.class, new ArcheryTech());
		technologies.put(MiningTech.class, new MiningTech());
		technologies.put(SailingTech.class, new SailingTech());
		technologies.put(CalendarTech.class, new CalendarTech());
		technologies.put(WritingTech.class, new WritingTech());
		technologies.put(TrappingTech.class, new TrappingTech());
		technologies.put(WheelTech.class, new WheelTech());
		technologies.put(MasonryTech.class, new MasonryTech());
		technologies.put(BronzeWorkingTech.class, new BronzeWorkingTech());
		technologies.put(HorsebackRridingTech.class, new HorsebackRridingTech());
		technologies.put(MathematicsTech.class, new MathematicsTech());
		technologies.put(ConstructionTech.class, new ConstructionTech());
		technologies.put(IronWorkingTech.class, new IronWorkingTech());
		
		Civilization.getInstance().getEventManager().addListener(PickResearchListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
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

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		researchingTech = null;
	}

	@Override
	public void onPickResearch(Technology tech) {
		researchingTech = tech;
	}

	public boolean isResearching() {
		return researchingTech != null;
	}
}
