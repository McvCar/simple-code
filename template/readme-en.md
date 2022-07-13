
# Basic use tutorial:

1. Click the mouse to select the script or node with binding script on the scene, and then automatically load the code to enter editing

2. Double click the scene label to edit the content directly

3. Adaptive layout setting: https://forum.cocos.org/t/topic/103380

4. Latest documents: https://store.cocos.com/#/resources/detail/2313  


# Main functions

-1. Memo (the first page to start the plug-in)

-2. Vscode Mini search bar (used to open files and scenes, shortcut [**V**])

-3. Vscode code editor function

-4. Search for unused resources (In the Explorer right-click menu)

-5. Dragging resources or nodes to scripts automatically generates variables and bindings

-6. Modifying the TS / JS file path in the resource manager of creator can automatically synchronize the code import / require reference path

# Auxiliary editing function:

-1. Quickly generate the script and bind the node (select the node in the scene with the mouse and press [**F3**] to quickly generate the script and bind it. The script is generated in the same level directory of the scene. The format of the generated code template can be configured in settings

-2. Batch rename. Right click the menu to select the function

-4. Batch bind components (when the mouse selects the node, press [**G**] to open the component interface, and then bind the component to the node)

-5. Batch insert prefabricated nodes (when the mouse selects the nodes, press [**A**] to open the interface of prefabricated nodes, and then insert the prefabricated nodes into the scene)

-6. Quick batch deletion of nodes and binding scripts (select the node with mouse, press [**Alt+Shift+enter**] to pop up the confirmation interface for deletion)

-7. Shortcut key directory (you can bind 'folder' to 'number key shortcut key', and jump to the specified directory by pressing the number key. usage method:

After selecting the folder, bind the shortcut key: Alt + [**0-9**] bind the specified number key label, press [**0~9**] to jump to the bound folder location)

-8. Shortcut node (press [**Alt+\~*] to save the selection status of all nodes in the current scene, and press [**\~*] to return to the previously saved node selection status)

-9. Batch select nodes with the same name (similar to batch select nodes with the same name by pressing **Ctrl+D** in vscode, and the operation is quick [**S**] or [**Alt+D**])


# Project management:

-1. [**Alt+F1**] open project directory

-2 [**Alt+F2**] open the project directory to the external editor. The editor path configuration is opened in the configuration shortcut options

-3 [**Alt+F3**] open the project directory to the new creator window

-4. There are also configuration shortcut keys, templates, code input prompt settings.

# Code editing function:

-1. TS / JS code prompt function is better than vsode, and supports module code prompt introduced by import / require

-2. Support cross file prompt of function name in game project

-3. Support variable reference location search and jump

-4. Support **Ctrl+click** to jump to the file location of object member declaration

-5. Support JSON / JS / TS document format

-6. Remember to open the code before closing the creator, restart the creator to recover the code tag, and quickly enter the last working state;

-7. Support [**Ctrl+Shift+O**] function jump... Other dozens of functions are the same as vscode, so I will not introduce them one by one

-8. Support to import user-defined XXXX_ Api.d.ts code declaration file,

Usage: put the d.ts declaration file to the root directory of the project (at the same level as the assets folder), and then restart creator

-9. JS code function jump / prompt conversion function reaches the level of webstorm editor

-10. Add rainbow bracket plug-in

-11. VIM mode supports multiple cursors

-12. Support **Ctrl+Shift+y** to open the console and input commands

  
The following functions will not work when running in a separate window:

- Batch rename [D]

- Batch binding component [G]

- Batch insert prefabricated nodes [A]

- Batch search for children of the selected node [F]

- Quickly open Scene or Prefab, shortcut keys [V]

- Searches for unused resources

- Double-click Label to edit

- New script and bind Node(menu option missing)

 

*Note: for large projects, it is recommended to change the compilation trigger mode to manual

e-mail: 1039359608@qq.com

^If you think it's easy to use, I'd like to give you a high praise and support. Thank you for your support^
