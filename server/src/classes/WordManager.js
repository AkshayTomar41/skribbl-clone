const { v4: uuidv4 } = require('uuid');

/**
 * WordManager – manages categorized word lists and random selection
 */
class WordManager {
  constructor() {
    this.categories = {
      animals: [
        'dog', 'cat', 'elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo',
        'crocodile', 'flamingo', 'parrot', 'jellyfish', 'octopus', 'butterfly',
        'chameleon', 'gorilla', 'cheetah', 'peacock', 'porcupine', 'meerkat',
        'platypus', 'hedgehog', 'narwhal', 'axolotl', 'capybara', 'fennec fox',
        'sloth', 'pangolin', 'wombat', 'quokka', 'mantis shrimp', 'otter',
        'raccoon', 'skunk', 'armadillo', 'anteater', 'toucan', 'koala',
        'llama', 'alpaca', 'bison', 'walrus', 'manatee', 'tapir', 'lynx',
        'wolverine', 'ocelot', 'hyena', 'mole', 'vole', 'hamster'
      ],
      food: [
        'pizza', 'sushi', 'hamburger', 'taco', 'pasta', 'sandwich', 'hot dog',
        'ice cream', 'donut', 'waffle', 'pancake', 'burrito', 'ramen', 'dumpling',
        'croissant', 'pretzel', 'bagel', 'cupcake', 'macaron', 'churro',
        'baguette', 'pho', 'paella', 'risotto', 'gyoza', 'falafel', 'hummus',
        'guacamole', 'nachos', 'quesadilla', 'empanada', 'moussaka', 'baklava',
        'tiramisu', 'cheesecake', 'brownie', 'muffin', 'cookie', 'eclair',
        'popcorn', 'pretzel', 'spring roll', 'fried rice', 'noodles', 'steak',
        'lobster', 'crab', 'shrimp', 'salmon', 'avocado', 'smoothie'
      ],
      objects: [
        'bicycle', 'umbrella', 'telescope', 'microscope', 'compass', 'lantern',
        'anchor', 'balloon', 'camera', 'clock', 'crown', 'diamond', 'envelope',
        'feather', 'globe', 'hammer', 'hourglass', 'key', 'ladder', 'magnet',
        'mirror', 'paintbrush', 'parachute', 'puzzle', 'rainbow', 'rocket',
        'scissors', 'shield', 'snowflake', 'suitcase', 'thermometer', 'trophy',
        'volcano', 'windmill', 'wrench', 'yacht', 'yo-yo', 'zipper', 'anvil',
        'boomerang', 'candle', 'compass', 'drum', 'fidget spinner', 'funnel',
        'gavel', 'kaleidoscope', 'lollipop', 'magnifying glass', 'metronome',
        'piggy bank', 'pulley', 'sextant', 'stopwatch', 'sundial'
      ],
      places: [
        'beach', 'mountain', 'jungle', 'desert', 'volcano', 'cave', 'island',
        'lighthouse', 'castle', 'library', 'museum', 'stadium', 'airport',
        'subway', 'marketplace', 'hospital', 'school', 'church', 'palace',
        'pyramid', 'skyscraper', 'bridge', 'dam', 'waterfall', 'glacier',
        'coral reef', 'swamp', 'savanna', 'tundra', 'fjord', 'canyon',
        'oasis', 'lagoon', 'harbor', 'plaza', 'alley', 'rooftop', 'greenhouse',
        'observatory', 'aquarium', 'zoo', 'park', 'forest', 'meadow',
        'quarry', 'mine', 'factory', 'lighthouse', 'treehouse', 'igloo'
      ],
      actions: [
        'jumping', 'swimming', 'flying', 'climbing', 'dancing', 'singing',
        'cooking', 'painting', 'reading', 'writing', 'running', 'sleeping',
        'laughing', 'crying', 'fishing', 'surfing', 'skateboarding', 'skiing',
        'cycling', 'hiking', 'rowing', 'diving', 'juggling', 'balancing',
        'meditating', 'stretching', 'throwing', 'catching', 'kicking', 'hugging',
        'waving', 'pointing', 'sneezing', 'yawning', 'whistling', 'clapping',
        'shrugging', 'tiptoeing', 'somersaulting', 'moonwalking', 'posing',
        'bowing', 'flexing', 'spinning', 'floating', 'crawling', 'sneaking',
        'peeking', 'shouting', 'whispering'
      ],
      movies: [
        'Titanic', 'Avatar', 'Inception', 'Interstellar', 'Jurassic Park',
        'The Matrix', 'Star Wars', 'Indiana Jones', 'Harry Potter', 'Spider-Man',
        'Iron Man', 'The Avengers', 'Batman', 'Superman', 'The Lion King',
        'Frozen', 'Toy Story', 'Finding Nemo', 'Shrek', 'Moana', 'Coco',
        'Up', 'Wall-E', 'Cars', 'Ratatouille', 'The Incredibles', 'Mulan',
        'Tarzan', 'Aladdin', 'Beauty and the Beast', 'Cinderella', 'Pinocchio',
        'Dumbo', 'Bambi', 'Fantasia', 'Sleeping Beauty', 'Snow White',
        'The Little Mermaid', 'Pocahontas', 'Hercules', 'Lilo and Stitch',
        'Bolt', 'Big Hero 6', 'Wreck-It Ralph', 'Zootopia', 'Encanto'
      ],
      sports: [
        'soccer', 'basketball', 'tennis', 'baseball', 'volleyball', 'cricket',
        'rugby', 'golf', 'hockey', 'badminton', 'table tennis', 'boxing',
        'wrestling', 'gymnastics', 'swimming', 'diving', 'archery', 'fencing',
        'weightlifting', 'cycling', 'running', 'long jump', 'high jump',
        'pole vault', 'discus', 'javelin', 'shotput', 'marathon', 'triathlon',
        'rowing', 'kayaking', 'sailing', 'surfing', 'skateboarding', 'snowboarding',
        'skiing', 'ice skating', 'figure skating', 'curling', 'bobsled',
        'luge', 'biathlon', 'climbing', 'equestrian', 'judo', 'taekwondo',
        'karate', 'sumo', 'polo', 'lacrosse'
      ],
      technology: [
        'smartphone', 'laptop', 'tablet', 'keyboard', 'mouse', 'monitor',
        'printer', 'headphones', 'webcam', 'microphone', 'router', 'satellite',
        'drone', 'robot', 'solar panel', 'electric car', 'submarine', 'spaceship',
        'telescope', 'microscope', 'calculator', 'USB drive', 'hard drive',
        'cloud', 'QR code', 'barcode', 'fingerprint', 'hologram', 'VR headset',
        'smart watch', 'GPS', 'radar', 'sonar', 'X-ray', 'MRI machine',
        '3D printer', 'circuit board', 'battery', 'solar power', 'wind turbine',
        'nuclear reactor', 'fiber optics', 'laser', 'scanner', 'projector'
      ]
    };
  }

  getRandomWords(count = 3, category = null) {
    let wordPool = [];

    if (category && this.categories[category]) {
      wordPool = [...this.categories[category]];
    } else {
      // Mix words from all categories
      Object.values(this.categories).forEach(words => {
        wordPool = wordPool.concat(words);
      });
    }

    // Shuffle and take `count`
    const shuffled = wordPool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getAllCategories() {
    return Object.keys(this.categories);
  }

  generateHint(word, revealedIndices) {
    return word.split('').map((char, i) => {
      if (char === ' ') return ' ';
      if (revealedIndices.includes(i)) return char;
      return '_';
    }).join('');
  }

  getNextRevealIndex(word, currentRevealed) {
    const letterIndices = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== ' ' && !currentRevealed.includes(i)) {
        letterIndices.push(i);
      }
    }
    if (letterIndices.length === 0) return null;
    return letterIndices[Math.floor(Math.random() * letterIndices.length)];
  }
}

module.exports = WordManager;
