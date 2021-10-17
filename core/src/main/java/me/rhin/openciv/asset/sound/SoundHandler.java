package me.rhin.openciv.asset.sound;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

import com.badlogic.gdx.audio.Music;
import com.badlogic.gdx.audio.Sound;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.SoundEnum.SoundType;
import me.rhin.openciv.listener.SetScreenListener;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.screen.type.TitleScreen;

//TODO: Not sure if I should be using this
public class SoundHandler implements SetScreenListener {

	private ArrayList<Music> ambienceTracks;
	private ArrayList<Music> titleMusicTacks;

	private HashMap<SoundEnum, Music> musicMap;
	private HashMap<SoundEnum, Sound> effectMap;
	private Music currentMusic;
	private Music currentAmbience;

	public SoundHandler() {
		this.musicMap = new HashMap<>();
		this.effectMap = new HashMap<>();
		this.ambienceTracks = new ArrayList<>();
		this.titleMusicTacks = new ArrayList<>();

		// Civilization.getInstance().getEventManager().addListener(SetScreenListener.class,
		// this);
	}

	@Override
	public void onSetScreen(ScreenEnum prevScreenEnum, ScreenEnum screenEnum) {

		if (prevScreenEnum == ScreenEnum.SERVER_LOBBY && screenEnum == ScreenEnum.IN_GAME) {
			// Stop playing titlescreen music
			currentMusic.stop();
			// currentMusic.dispose();
			currentMusic = null;
		}

		if (screenEnum == ScreenEnum.TITLE && prevScreenEnum == ScreenEnum.IN_GAME) {
			// Stop playing ambient music & ingame music
			currentAmbience.stop();

			if (currentMusic != null)
				currentMusic.stop();
			// currentMusic.dispose();
			currentMusic = null;
			currentAmbience = null;
		}
	}

	public void loadSounds() {
		for (SoundEnum soundEnum : SoundEnum.values()) {

			String soundPath = "sound/" + soundEnum.getSoundType().name().toLowerCase() + "/"
					+ soundEnum.name().toLowerCase() + ".ogg";

			switch (soundEnum.getSoundType()) {
			case EFFECT:
				Sound effect = Civilization.getInstance().getAssetHandler().get(soundPath, Sound.class);
				effectMap.put(soundEnum, effect);
				break;
			case AMBIENCE:
				Music ambience = Civilization.getInstance().getAssetHandler().get(soundPath, Music.class);
				ambience.setVolume(soundEnum.getVolume());
				ambienceTracks.add(ambience);
				break;
			case MUSIC:
				Music music = Civilization.getInstance().getAssetHandler().get(soundPath, Music.class);
				music.setVolume(soundEnum.getVolume());
				titleMusicTacks.add(music);
				break;
			default:
				break;
			}

		}
	}

	public void playEffect(SoundEnum soundEnum) {

		if (soundEnum.getSoundType() != SoundType.EFFECT) {
			// TODO: Throw error
			return;
		}

		Sound sound = effectMap.get(soundEnum);

		long id = sound.play();
		sound.setVolume(id, soundEnum.getVolume());
	}

	public void playTrackBySoundtype(SoundType soundType) {
		playTrackBySoundtype(Civilization.getInstance().getCurrentScreen(), soundType);
	}

	public void playTrackBySoundtype(AbstractScreen screen, SoundType soundType) {

		if (currentAmbience != null)
			currentAmbience.stop();

		if (screen instanceof TitleScreen && currentMusic != null)
			return;

		if (currentMusic != null)
			currentMusic.stop();

		ArrayList<Music> musicTrack = null;
		switch (soundType) {
		case AMBIENCE:
			musicTrack = ambienceTracks;
			break;
		case MUSIC:
			musicTrack = titleMusicTacks;
			break;
		default:
			break;
		}

		Random rnd = new Random();

		Music rndSound = musicTrack.get(rnd.nextInt(musicTrack.size()));
		rndSound.play();

		if (soundType == SoundType.AMBIENCE)
			currentAmbience = rndSound;
		else
			currentMusic = rndSound;

		rndSound.setOnCompletionListener(new Music.OnCompletionListener() {
			@Override
			public void onCompletion(Music music) {
				playTrackBySoundtype(soundType);
			}
		});
	}
}
