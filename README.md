※ [한국어 버전 README](README(Kor).md)

# Synaptic Route 1.0.0

🎉 Initial Release

👋 Hello, I'm Lucy, focusing on Self Facilitation and Synaptic Hub for personal holistic management.

Self Facilitation is a powerful methodology that goes beyond commonplace growth advice—it transforms abstract wisdom into concrete, actionable frameworks. My vision is to help people build their own unique universe where knowledge and action come together naturally. You can pick up where you left off anytime, continuously building your knowledge and capabilities along the way. Instead of focusing on understanding, I create practical workflows by combining simple, actionable steps.

Synaptic Hub functions as a sophisticated toolkit for Self Facilitation, and among its components is Synaptic Route, which I'm currently developing. Just as human brains rewire themselves through experience, Obsidian allows you to construct your own idea-rich universe. Synaptic Route supercharges this process, facilitating the creation of powerful neural networks from your knowledge and ideas.

Knowledge isn't merely about storage—it's about extraction and transformation. Synaptic Route transcends traditional knowledge management by not just storing and extracting information, but by catalyzing the discovery of breakthrough IDEAS. It's designed to unearth connections you never knew existed and transform dormant knowledge into actionable insights.

This is just the beginning—new capabilities will continuously evolve to enhance your journey of knowledge transformation.

## Key Features

- **Keyword Visualization**: Supports keyword word clouds, charts (bar, pie, polar, radar), and table formats based on the current file or all files
  - **Flexible Keyword Extraction**: Extract keywords based on tags, file name prefixes/suffixes, or regular expressions
  - **Lucy Zettelkasten Workflow Support**: Visualize connections between literature notes and permanent notes
  - **Theme Support**: Supports light and dark modes
  - **Screenshot Capture**: Capture visualized results as images and save them to the clipboard
  - **Style Settings Support**: Customize styles through the Style Settings plugin
- More features may be added in future updates...

## Usage

Include the following in a code block:

```SynapticRoute
Type: WordCloud|Chart|Table
ChartType: Bar|Pie|Polar|Radar
Global: true|false
MaxItem: <number>
MaxRandomItem: <number>
Theme: Dark|Light
```

### Option Details

- **Type**: Visualization type (default: WordCloud)
- **ChartType**: Type of chart when 'Chart' is selected (default: Bar)
- **Global**: Include all notes or not (default: false)
- **MaxItem**: Maximum number of items to display (default: 30)
- **MaxRandomItem**: Number of random items to include when exceeding MaxItem (default: 5)
- **Theme**: Visual theme (default: Dark)

## Plugin Settings

Configure the following items in the plugin settings:

1. **Keyword Selection Method**
   - Based on tags
   - File name prefixes/suffixes
   - Regular expressions

2. **Lucy Zettelkasten Options**
   - Literature note selection method
   - Permanent note selection method

3. **Filtering Options**
   - Exclude folder paths
   - Exclude tags
   - Exclude file name patterns

## Style Settings

Through the [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin, you can customize the following styles:

- **Theme Integration**: Automatically apply style properties from the currently used Obsidian theme
- **(Recommended) Custom Styles**: Support for plugin-specific style settings

## Installation

1. Go to Community Plugins in Obsidian's settings
2. Search for "Synaptic Route"
3. Install and activate the plugin
4. (Optional) Install the Style Settings plugin for additional customization

## Support

- For bug reports or feature suggestions, please use GitHub Issues
- Contact: 
  - [E-Mail](mailto:synapticpkm@gmail.com)
  - [Twitter @Facilitate4U](https://x.com/Facilitate4U)
