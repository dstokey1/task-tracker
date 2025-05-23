/**
 * Task Tracker Logic:
 * This script handles the logic for a task tracker application. It includes functions to add, delete, and update tasks, as well as to filter and sort them based on various criteria.
 * The script also manages custom tags and their rendering in the UI. It uses local storage to persist tasks and tags across sessions.
 * 
 * Created by Daniel Stokes
 * May 2025
 */

let tasklist = []; //logs all tasks
let customTags = []; //logs all custom tags
let currentStatusFilter = "";
let currentTagFilters = [];
let currentSort = "dueDate"; // default sort order

/** Saves tasks to local storage */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasklist));
}

/** Saves custom tags to local storage */
function saveTags() {
    localStorage.setItem("tags", JSON.stringify(customTags));
}

/** Loads tasks from local storage */
function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (saved) {
      tasklist = JSON.parse(saved);
    }
}

/** Loads custom tags from local storage */
function loadTags() {
    const saved = localStorage.getItem("tags");
    if (saved) {
        customTags = JSON.parse(saved);
    }
}

/** Checks if a task is overdue 
 * @param {string} dueDate The due date of the task
 * @param {Date} currentDatetime The current date and time
 * @return {boolean} Returns true if the task is overdue, false otherwise
*/
function checkOverdue(dueDate, currentDatetime) {
    if (!dueDate) return false; // No due date means not overdue
    const due = new Date(dueDate);
    return due < currentDatetime; 
}

/** Formats a date string into a custom format
 * @param {string} dateStr The date string to format
 * @return {string} The formatted date string
 */
function customDateString(dateStr){
    
    const date = new Date(dateStr);
    
    const options = {
        weekday: 'short',   // "Sun"
        month: 'short',     // "May"
        day: '2-digit',     // "04"
        year: 'numeric',    // "2025"
    };
    
    const datePart = date.toLocaleDateString(undefined, options); // "Sun, May 04, 2025"
    const timePart = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    }); // "9:30 PM"
    
    return `${datePart} at ${timePart}`;
}

/** Wraps text to a specified line length for horizontal layout control
 * @param {string} text The text to wrap
 * @param {number} maxLineLength The maximum line length
 * @return {string} The wrapped text
 */
function wrapText(text, maxLineLength) {
    const words = text.split(" ");
    let wrappedText = "";
    let currentLine = "";

    words.forEach((word) => {
        if (currentLine.length + word.length + 1 <= maxLineLength) {
            currentLine += (currentLine ? " " : "") + word;
        } else {
            wrappedText += (wrappedText ? "\n" : "") + currentLine;
            currentLine = word;
        }
    });

    wrappedText += (wrappedText ? "\n" : "") + currentLine;
    return wrappedText;
}

/** Adds a new task to the task list
 * @param {string} title The title of the task
 * @param {string} dueDate The due date of the task
 * @param {string} priority The priority of the task
 * @param {string} status The status of the task (default is 'open')
 * @param {Array} tags The tags associated with the task
 * @param {string} notes The notes associated with the task (default is empty string)
 * @return {Object} The newly created task object
 */
function addTask(title, dueDate, priority, status = 'open', tags, notes = '') {

    const newTask = {
        title: title,
        dueDate: dueDate,
        priority: priority,
        status: status,
        tags: tags,
        notes: notes,
        dateCreated: Date.now()
    };
    tasklist.push(newTask);
    saveTasks();
    return newTask;
}

/** Adds a custom tag to the list of tags
 * @param {string} tag The custom tag to add
 * @return {string} The added tag
 */
function addTag(tag) {
    if (!customTags.includes(tag)) {
        customTags.push(tag);
        saveTags();
    }
    return tag;
}

/** Renders a custom tag in the form submission area    
 * @param {string} tag The custom tag to render
 * @param {HTMLElement} tagContainer The container element to render the tag in
 * @return {HTMLElement} The rendered tag element
 */
function renderCustomTag(tag, tagContainer) {
    const wrapper = document.createElement("div");
    wrapper.className = "tagCheckbox";
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.marginRight = "8px";
    wrapper.style.marginBottom = "8px";

    const tagOption = document.createElement("input");
    tagOption.type = "checkbox";
    tagOption.value = tag;
    tagOption.className = "tag_option";

    const label = document.createElement("label");
    label.textContent = ` ${tag}`;
    label.prepend(tagOption);    

    wrapper.appendChild(label);

    const deleteBtn = renderDeleteButton(tag, wrapper, 16); 
    deleteBtn.style.position = "relative";
    deleteBtn.style.padding = "0px";
    deleteBtn.style.marginLeft = "8px";

    tagContainer.appendChild(wrapper);
    return wrapper;
}

/** Renders all custom tags in the form submission area */
function renderCustomTags() {
    const tagContainer = document.getElementById("customTagOptions");
    tagContainer.innerHTML = ""; // Clear existing tags
    customTags.forEach(tag => {
        renderCustomTag(tag, tagContainer);
    });
    return;
}

/** Renders and handles the status button for a task
 * @param {Object} task The task object
 * @param {HTMLElement} taskContainer The container element to render the button in
 * @return {HTMLElement} The rendered status button element
 */
function renderStatusButton(task, taskContainer) {
    const statusBtn = document.createElement("button");
    statusBtn.style.background = "none";
    statusBtn.style.border = "none";
    statusBtn.style.cursor = "pointer";
    statusBtn.style.width = "24px";
    statusBtn.style.height = "24px";

    const statusIcon = document.createElement("img");
    statusIcon.style.width = "32px";
    statusIcon.style.height = "32px";
    statusIcon.src = task.status === "open" ? "./images/unchecked.svg" : "./images/checked.svg";

    statusBtn.appendChild(statusIcon);

    // handle the status button click, toggles between open and closed
    statusBtn.onclick = () => {
        const newStatus = task.status === "open" ? "closed" : "open";
        updateStatus(task.dateCreated, newStatus);
        applyFiltersAndSort(); // re-renders all task cards
    };

    statusIcon.style.opacity = "1";
    statusIcon.style.transition = "opacity .2s";
    statusBtn.onmouseover = () => statusIcon.style.opacity = "0.5";
    statusBtn.onmouseout = () => statusIcon.style.opacity = "1";

    taskContainer.appendChild(statusBtn);
    return statusBtn;
}

/** Renders and handles the delete button for a task or custom tag
 * @param {Object|string} target The task object or custom tag to delete
 * @param {HTMLElement} container The container element to render the button in
 * @param {number} size The size of the button in px (default is 20)
 * @return {HTMLElement} The rendered delete button element
 */
function renderDeleteButton(target, container, size = 20) {
    const deleteBtn = document.createElement("button");
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.width = `${size}px`;
    deleteBtn.style.height = `${size}px`;

    const deleteIcon = document.createElement("img");
    deleteIcon.src = "./images/delete.svg";
    deleteIcon.style.width = "100%";
    deleteIcon.style.height = "100%";
    deleteIcon.style.opacity = "0.5";
    deleteIcon.style.transition = "opacity .2s";
    deleteIcon.onmouseover = () => deleteIcon.style.opacity = "1";
    deleteIcon.onmouseout = () => deleteIcon.style.opacity = "0.5";

    deleteBtn.appendChild(deleteIcon);

    if (typeof target === "object" && target.dateCreated) { // task object
        deleteBtn.onclick = () => deleteTask(target.dateCreated);
    } else { // custom tag
        deleteBtn.onclick = () => deleteTag(target);
    }

    container.appendChild(deleteBtn);
    return deleteBtn;
}

/** Renders and handles the edit button for a task's notes
 * @param {Object} task The task object
 * @param {HTMLElement} taskContainer The container element to render the button in
 * @param {number} size The size of the button in px (default is 24)
 * @return {HTMLElement} The rendered edit button element
 */
function renderEditButton(task, taskContainer, size) {
    const editBtn = document.createElement("button");
    editBtn.style.background = "none";
    editBtn.style.border = "none";
    editBtn.style.cursor = "pointer";
    editBtn.style.width = `${size}px`;
    editBtn.style.height = `${size}px`;

    const editIcon = document.createElement("img");
    editIcon.src = "./images/edit.svg";
    editIcon.style.width = "100%";
    editIcon.style.height = "100%";
    editIcon.style.opacity = "0.5";
    editIcon.style.transition = "opacity .2s";
    editIcon.onmouseover = () => editIcon.style.opacity = "1";
    editIcon.onmouseout = () => editIcon.style.opacity = "0.5";
    editBtn.appendChild(editIcon);

    // handle the edit button click, opens the edit notes modal
    editBtn.addEventListener("click", () => {
        const notesModal = document.getElementById("taskNotesEditModal");
        notesModal.style.display = "block";
        notesModal.style.height = "400px";
        notesModal.style.width = "500px";
        
        const notesTextArea = document.getElementById("taskNotesTextArea");
        notesTextArea.value = task.notes;
        notesTextArea.style.width = "100%";
        notesTextArea.style.height = "100%";
        notesTextArea.style.borderRadius = "4px";
        notesTextArea.style.padding = "8px";
        notesTextArea.style.fontSize = "1em";
        notesTextArea.style.resize = "none";

        const saveBtn = document.getElementById("saveEditBtn");

        // handle the save button click
        saveBtn.onclick = () => {
            task.notes = notesTextArea.value;
            saveTasks();
            applyFiltersAndSort();
            notesModal.style.display = "none";
        };
    });

    taskContainer.appendChild(editBtn);
    return editBtn;
}

/** Renders a task in the UI
 * @param {Object} task The task object to render
 * @param {HTMLElement} taskDiv The container element to render the task in
 * @return {void}
 */
function renderTask(task, taskDiv) {
    const container = document.createElement("div"); // for the horizontal layout
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.fontSize = "large";
    container.style.gap = "16px";
    container.style.lineHeight = "1.5"; 

    // ----- STATUS ICON COLUMN -----
    const statusColumn = document.createElement("div");
    statusColumn.style.flex = "0 0 auto";
    statusColumn.style.display = "flex";
    statusColumn.style.marginTop = "4px";
    statusColumn.style.paddingRight = "8px";
    renderStatusButton(task, statusColumn);
    container.appendChild(statusColumn);

    // ----- MAIN INFO COLUMN -----
    const mainInfo = document.createElement("div");
    mainInfo.style.flex = "2";
    mainInfo.style.padding = "8px";
    mainInfo.style.lineHeight = "2";
    mainInfo.style.maxWidth = "33%";

        // Title
    const titleEl = document.createElement("strong");
    titleEl.style.lineHeight = "2";
    titleEl.textContent = (task.title.length > 48) ? wrapText(task.title, 48) : task.title;
    titleEl.style.marginBottom = "16px";
    mainInfo.appendChild(titleEl);

        // Due Date
    if (task.dueDate) {
        const due = document.createElement("div");
        due.textContent = `${customDateString(task.dueDate)}`;
        mainInfo.appendChild(due);
    }

        // Tags
    if (task.tags.length > 0) {
        const tagsLine = document.createElement("div");
        tagsLine.style.display = "flex";
        tagsLine.style.flexWrap = "wrap";
        tagsLine.style.alignItems = "flex-start";
        tagsLine.style.gap = "8px";
    
        task.tags.forEach(tag => {
            const tagEl = document.createElement("span"); // span for inline display
            tagEl.textContent = tag;
            tagEl.style.lineHeight = "1"; 
            tagEl.style.display = "inline-flex";
            tagEl.style.alignItems = "center";
            tagEl.style.padding = "4px 8px";
            tagEl.style.borderRadius = "4px";
            tagEl.style.fontSize = "0.9em";
            tagEl.style.whiteSpace = "nowrap";
            tagEl.style.height = "fit-content";

            // Set background color and border based on status and overdue
            if (checkOverdue(task.dueDate, new Date()) && task.status === "open") {
                tagEl.style.backgroundColor = "#fec4c8"; 
                tagEl.style.border = "1px solid #f99a85";
            } else {
                tagEl.style.backgroundColor = (task.status === "open") ? "#fdf1c5" : "#c5bea0";
                tagEl.style.border = (task.status === "open") ? "1px solid #e5d8a8" : "1px solid #b1a780";
            }
            
            tagsLine.appendChild(tagEl); // add the tag span to the line
        });
    
        mainInfo.appendChild(tagsLine); // add the line of tags to the main info column
    }    

    container.appendChild(mainInfo);

    // ----- RIGHT COLUMN: NOTES + PRIORITY -----
    const rightColumn = document.createElement("div");
    rightColumn.style.display = "flex";
    rightColumn.style.flexDirection = "column";
    rightColumn.style.flex = "1";
    rightColumn.style.alignItems = "center";
    rightColumn.style.marginRight = "32px";

    if (!task.notes) {
        // Add the edit button to the right column if the user has not added any notes
        const notesEditBtn = renderEditButton(task, rightColumn, 24);
        notesEditBtn.style.padding = "0px";
        notesEditBtn.style.marginTop = "auto";
        notesEditBtn.style.marginBottom = "auto";
    }
    
    if (task.notes) {
        // Inner wrapper to center notes
        const notesWrapper = document.createElement("div");
        notesWrapper.style.flex = "1";
        notesWrapper.style.display = "flex";
        notesWrapper.style.alignItems = "center"; 

        // Add the edit button to the left of the notes
        const notesEditBtn = renderEditButton(task, notesWrapper, 24);
        notesEditBtn.style.position = "relative";
        notesEditBtn.style.padding = "0px";
        notesEditBtn.style.marginRight = "8px";
        notesEditBtn.style.marginLeft = "auto"; 

        // Create a box for the notes
        const notesBox = document.createElement("div");
        notesBox.style.fontSize = "medium";
        notesBox.style.padding = "8px";
        notesBox.style.borderRadius = "8px";
        notesBox.textContent = (task.notes.length > 85) ? wrapText(task.notes, 85) : task.notes;

        // Set background color and border based on status and overdue
        if (checkOverdue(task.dueDate, new Date()) && task.status === "open") {
            notesBox.style.backgroundColor = "#fde4df"; 
            notesBox.style.border = "1px solid #f98369";
        } else {
            notesBox.style.backgroundColor = (task.status === "open") ? "#fffdf6" : "#dedcd6";
            notesBox.style.border = "1px solid #ccc";
        }

        notesWrapper.appendChild(notesBox);
        rightColumn.appendChild(notesWrapper);
    }

    if (task.priority) {
        const priorityLabel = document.createElement("div");
        priorityLabel.textContent = `Priority: ${task.priority}`;
        priorityLabel.style.fontSize = "0.9em";
        priorityLabel.style.color = "#666";
        priorityLabel.style.marginTop = "auto"; 
        priorityLabel.style.marginLeft = "auto";
        priorityLabel.style.alignSelf = "flex-end";
        rightColumn.appendChild(priorityLabel);
    }

    container.appendChild(rightColumn);

    // ----- DELETE BUTTON -----
    const deleteBtn = renderDeleteButton(task, taskDiv, 20);
    deleteBtn.style.position = "absolute";
    deleteBtn.style.top = "4px";
    deleteBtn.style.right = "8px";
    deleteBtn.style.padding = "0px";

    taskDiv.appendChild(container);
    return;
}

/** Renders all tasks in an array of tasks
 * @param {Array} tasks The list of tasks to render (default is the entire task list)
 * @return {void}
 * */
function renderTasks(tasks = tasklist) {
    const container = document.getElementById("output");

    if (tasks.length === 0) {
        container.innerHTML = "No tasks found.";
        return;
    }

    container.innerHTML = ""; 

    const currentDatetime = new Date(); 

    tasks.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.style.padding = "8px";
      taskDiv.style.marginBottom = "8px";
      taskDiv.style.position = "relative";


      // adjust the background color and border based on status and overdue
      if (checkOverdue(task.dueDate, currentDatetime) && task.status === "open") {
        taskDiv.style.backgroundColor = "#fed4d6";
        taskDiv.style.border = "2px solid #d6040b";
      } else {
        taskDiv.style.backgroundColor = (task.status === "closed") ? "#cec8b3" : "#fff8df";
        taskDiv.style.border = "1px solid #000";
      }
      
      renderTask(task, taskDiv); // display Task details
  
      container.appendChild(taskDiv);
    });

    return;
}

/** Renders the default tag filters in the modal
 * @returns {Array} The default tags
 */
function renderDefaultTagFilters() {
    const defaultTagFilters = document.getElementById("tagFilters");
    defaultTagFilters.innerHTML = ""; 
    const defaultTags = ["meeting", "assignment", "event", "chore", "virtual"];
    defaultTags.forEach(tag => {
        const tagOption = document.createElement("div");
        tagOption.style.display = "inline-flex";
        tagOption.style.marginRight = "8px";
        tagOption.style.alignItems = "center";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.className = "tag_option";
        checkbox.checked = currentTagFilters.includes(tag);
        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                currentTagFilters.push(tag);
            } else {
                currentTagFilters = currentTagFilters.filter(t => t !== tag);
            }
            applyFiltersAndSort();
        });

        const label = document.createElement("label");
        label.textContent = ` ${tag}`;
        label.prepend(checkbox);
        tagOption.appendChild(label);
        defaultTagFilters.appendChild(tagOption);
    });

    return defaultTags;
}

/** Renders all tag filters in the modal
 * @returns {Array} The custom tags
 */
function renderTagFilters() { 

    renderDefaultTagFilters();

    const tagFilterOptions = document.getElementById("customTagFilters");
    tagFilterOptions.innerHTML = ""; 
    customTags.forEach(tag => {
        const tagOption = document.createElement("div");
        tagOption.style.display = "inline-flex";
        tagOption.style.marginRight = "8px";
        tagOption.style.alignItems = "center";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        
        checkbox.checked = currentTagFilters.includes(tag);

        // handle the checkbox change event, adds or removes the tag from the currentTagFilters array
        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                currentTagFilters.push(tag);
            } else {
                currentTagFilters = currentTagFilters.filter(t => t !== tag);
            }
            applyFiltersAndSort();
        });
        const label = document.createElement("label");
        label.textContent = ` ${tag}`;
        label.prepend(checkbox);
        tagOption.appendChild(label);

        tagFilterOptions.appendChild(tagOption);
    });
    return customTags;
}
  
/** Updates the status of a task
 * @param {string} dateCreated The date the task was created
 * @param {string} newStatus The new status of the task
 * @return {Array} The updated task list
 */
function updateStatus(dateCreated, newStatus) {
    const newTasks = tasklist.map(task => {
        // I allow for multiple tasks with the same Title, so I use dateCreated as a more unique identifier
        if (task.dateCreated === dateCreated) { 
            return { ...task, status: newStatus };
        }
        return task;
    }
    );
    tasklist = newTasks; 
    applyFiltersAndSort(); 
    saveTasks(); 
    return newTasks;
}
    
/** Applies the status filter to the task list
    * @param {Array} tasks The list of tasks to filter (default is the entire task list)
    * @param {string} status The status to filter by (default is the current status filter)
    * @return {Array} The filtered task list
    */    
function filterByStatus(tasks = tasklist, status = currentStatusFilter) {
    return [...tasks].filter(task => task.status === status);
}

/** Applies the tag filters to the task list
 * @param {Array} tasks The list of tasks to filter (default is the entire task list)
 * @param {Array} tagFilters The tags to filter by (default is the current tag filters)
 * @return {Array} The filtered task list
 */
function filterByTags(tasks = tasklist, tagFilters = currentTagFilters) {
    if (tagFilters.length === 0) return tasks; // No tags selected, return all tasks
    return [...tasks].filter(task => tagFilters.every(tag => task.tags.includes(tag)));
}

/** Sorts the task list based on the specified criteria
 * @param {string} criteria The criteria to sort by (defaults to dueDate)
 * @param {Array} tasks The list of tasks to sort (default is the entire task list)
 * @return {Array} The sorted task list
 */
function sortTasks(criteria, tasks = tasklist) {

    const priorityOrder = {"": 0, "low": 1, "medium": 2, "high": 3};
    
    const sortedTasks = [...tasks].sort((a, b) => {
        if (criteria === "newest") {
            return b.dateCreated - a.dateCreated; // default to dateCreated
        } else if (criteria === "priority") {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (criteria === "title") {
            return a.title.localeCompare(b.title);
        } else {
            // Default to sorting by dueDate
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
    });

    return sortedTasks;
}

/** Applies all filters and sorting to the task list, then renders the tasks
 * @returns {Array} The filtered and sorted task list
 */
function applyFiltersAndSort() {
    let filtered = (currentStatusFilter === "open" || currentStatusFilter === "closed") ? filterByStatus(tasklist, currentStatusFilter) : tasklist;
    filtered = filterByTags(filtered, currentTagFilters);
    let sorted = sortTasks(currentSort, filtered);
    renderTasks(sorted);
    return sorted;
}
  
/** Counts the number of tasks for each tag (not used in the current version)
 * @returns {Object} An object with tag counts
 */
function countTags() {
    return tasklist.reduce((counts, task) => {
        task.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
        return counts; 
    }, {});
}

/** Deletes a task from the task list, saves the updated list, and re-renders the tasks
 * @param {string} dateCreated The date the task was created
 * @return {Array} The updated task list
 */
function deleteTask(dateCreated) {
    // I allow for multiple tasks with the same Title, so I use dateCreated as a more unique identifier
    const newTasks = tasklist.filter(task => task.dateCreated !== dateCreated);
    tasklist = newTasks; 
    saveTasks(); 
    applyFiltersAndSort(); 
    return newTasks;
}

/** Deletes a custom tag from the list of tags, saves the updated list, and re-renders the tags
 * @param {string} tag The custom tag to delete
 * @return {Array} The updated list of custom tags
 */
function deleteTag(tag) {
    customTags = customTags.filter(t => t !== tag);
    saveTags();
    renderCustomTags();
    return customTags;
}

/** Clears all tasks from the task list, resets filters and sorting, and re-renders the tasks
 * @returns {Array} The cleared task list
 */
function clearTasks() {
    tasklist = [];
    currentStatusFilter = "";
    currentTagFilters = [];
    currentSort = "dueDate";
    document.getElementById("filter").value = "";
    document.getElementById("tagFilters").innerHTML = "";
    document.getElementById("sortOrder").value = "";
    saveTasks();
    renderTasks();
    return tasklist;
}


// DOM handlers // 
window.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadTags();
    applyFiltersAndSort();
    renderCustomTags();
});

//handles the form submission
document.getElementById("addTaskForm").addEventListener("submit", (e) => {
    
    e.preventDefault();

    const title = document.getElementById("title").value;
    const dueDate = document.getElementById("dueDate").value;
    const priority = document.getElementById("priority").value;
    const notes = document.getElementById("notes").value;

    const tags = Array.from(document.querySelectorAll("input.tag_option:checked")).map(tag => tag.value);
  
    addTask(title, dueDate, priority, 'open', tags, notes);
    applyFiltersAndSort();
  
    document.getElementById("addTaskForm").reset();
});

//handles the add tag button
document.getElementById("addTagBtn").addEventListener("click", () => {
    const tagInput = document.getElementById("newTagInput");
    const tagValue = tagInput.value.trim();

    if (tagValue && !customTags.includes(tagValue)) {
        addTag(tagValue);
        renderCustomTags();
        tagInput.value = ""; 
    }
});

//handles the filter change
document.getElementById("filter").addEventListener("change", (e) => {
    currentStatusFilter = e.target.value;
    applyFiltersAndSort();
});

//handles the sort change
document.getElementById("sortOrder").addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
});

//handles the clear tasks button
document.getElementById("clearTasksBtn").addEventListener("click", () => {
    clearTasks();
    saveTasks();
    applyFiltersAndSort();
});

//handles the tag filter button
document.getElementById("openTagModalBtn").addEventListener("click", () => {
    document.getElementById("tagModal").style.display = "block";
    renderTagFilters();
});

//handles the close tag modal button
document.getElementById("closeTagModalBtn").addEventListener("click", () => {
    document.getElementById("tagModal").style.display = "none";
});

//handles the clear tag filters button
document.getElementById("clearTagFiltersBtn").addEventListener("click", () => {
    currentTagFilters = [];
    const checkboxes = document.querySelectorAll("input.tag_option");
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    applyFiltersAndSort();
    renderTagFilters();
});

//handles the cancel button in the notes modal
document.getElementById("cancelEditBtn").addEventListener("click", () => {
    document.getElementById("taskNotesEditModal").style.display = "none";
});

//save note edits button handled in renderEditButton()