package me.rhin.openciv.ui.window;

public interface HorizontalWindow {

	// Returns total unseen width
	public float getTotalWidth();

	public void updatePositions(float scrubberX);

	public float getWidth();
	
}