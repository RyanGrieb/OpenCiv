package me.rhin.openciv.shared.util;

import java.util.ArrayList;
import java.util.Random;

import com.badlogic.gdx.graphics.Color;

public class ColorHelper {

	private ArrayList<Color> availableColors;

	public ColorHelper() {
		this.availableColors = new ArrayList<>();

		availableColors.add(Color.RED);
		availableColors.add(Color.GREEN);
		availableColors.add(Color.BLUE);
		availableColors.add(Color.VIOLET);
		availableColors.add(Color.WHITE);
		availableColors.add(Color.MAGENTA);
		availableColors.add(Color.CYAN);
		availableColors.add(Color.LIME);
		availableColors.add(Color.SCARLET);
	}

	public Color getRandomColor() {
		Random rnd = new Random();

		if (availableColors.size() < 1)
			return Color.WHITE;

		int num = rnd.nextInt(availableColors.size());
		Color color = availableColors.get(num);
		availableColors.remove(num);
		return color;
	}
}
