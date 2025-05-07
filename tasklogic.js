// logic for a task management system

let tasklist = []; //logs all tasks
let customTags = []; //logs all custom tags

let currentStatusFilter = "";
let currentTagFilters = [];
let currentSort = "newest"; // default sort order

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasklist));
}

function saveTags() {
    localStorage.setItem("tags", JSON.stringify(customTags));
}

function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (saved) {
      tasklist = JSON.parse(saved);
    }
}

function loadTags() {
    const saved = localStorage.getItem("tags");
    if (saved) {
        customTags = JSON.parse(saved);
    }
}

function checkOverdue(dueDate, currentDatetime) {
    if (!dueDate) return false; // No due date means not overdue
    const due = new Date(dueDate);
    return due < currentDatetime; 
}

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

function addTag(tag) {
    if (!customTags.includes(tag)) {
        customTags.push(tag);
        saveTags();
    }
    return customTags;
}

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
}

function renderCustomTags() {
    const tagContainer = document.getElementById("customTagOptions");
    tagContainer.innerHTML = ""; // Clear existing tags
    customTags.forEach(tag => {
        renderCustomTag(tag, tagContainer);
    });
    return customTags;
}

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

    statusBtn.onclick = () => {
        const newStatus = task.status === "open" ? "closed" : "open";
        updateStatus(task.dateCreated, newStatus);
        applyFiltersAndSort(); // re-renders all task cards
    };

    statusBtn.onmouseover = () => {
        statusIcon.style.opacity = "0.5";
    };
    statusBtn.onmouseout = () => {
        statusIcon.style.opacity = "1";
    };

    taskContainer.appendChild(statusBtn);
    return statusBtn;
}

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

    if (typeof target === "object" && target.dateCreated) {
        deleteBtn.onclick = () => deleteTask(target.dateCreated);
    } else {
        deleteBtn.onclick = () => deleteTag(target);
    }

    container.appendChild(deleteBtn);
    return deleteBtn;
}


function renderTask(task, taskDiv) {
    const container = document.createElement("div"); // Horizontal layout
    container.style.display = "flex";
    container.style.flexWrap = "wrap";

    // container.style.alignItems = "center"; // vertically center items
    container.style.fontSize = "large";
    container.style.gap = "16px";
    container.style.lineHeight = "1.5"; // increased vertical spacing

    // ----- STATUS ICON COLUMN -----
    const statusColumn = document.createElement("div");
    statusColumn.style.flex = "0 0 auto";
    statusColumn.style.display = "flex";
    // statusColumn.style.alignItems = "center";
    statusColumn.style.marginTop = "4px";
    statusColumn.style.paddingRight = "8px";
    renderStatusButton(task, statusColumn); // icon goes here
    container.appendChild(statusColumn);

    // ----- MAIN INFO COLUMN -----
    const mainInfo = document.createElement("div");
    mainInfo.style.flex = "2";
    mainInfo.style.padding = "8px";
    mainInfo.style.lineHeight = "2"; // increased vertical spacing

    const titleEl = document.createElement("strong");
    titleEl.style.lineHeight = "2"; // slightly increased vertical spacing
    titleEl.textContent = task.title;
    titleEl.style.marginBottom = "16px";
    mainInfo.appendChild(titleEl);

    if (task.dueDate) {
        const due = document.createElement("div");
        due.textContent = `${customDateString(task.dueDate)}`;
        mainInfo.appendChild(due);
    }

    if (task.tags.length > 0) {
        const tagsLine = document.createElement("div");
        tagsLine.style.display = "flex";
        tagsLine.style.flexWrap = "wrap";
        tagsLine.style.alignItems = "flex-start";
        tagsLine.style.gap = "8px";
        tagsLine.style.maxWidth = "100%";
        
        task.tags.forEach(tag => {
            const tagEl = document.createElement("span");
            tagEl.textContent = tag;
            tagEl.style.lineHeight = "1"; 
            tagEl.style.display = "inline-flex";
            tagEl.style.alignItems = "center";

            if (checkOverdue(task.dueDate, new Date()) && task.status === "open") {
                tagEl.style.backgroundColor = "#fec4c8"; // red for overdue
                tagEl.style.border = "1px solid #f99a85";
            } else {
                tagEl.style.backgroundColor = (task.status === "open") ? "#fdf1c5" : "#d4ceb4";
                tagEl.style.border = (task.status === "open") ? "1px solid #e5d8a8" : "1px solid #c4bb96";
            }

            tagEl.style.padding = "4px 8px";
            tagEl.style.borderRadius = "4px";
            tagEl.style.fontSize = "0.9em";
            tagEl.style.whiteSpace = "nowrap";
            tagEl.style.height = "fit-content";
            tagsLine.appendChild(tagEl);
        });
    
        mainInfo.appendChild(tagsLine);
    }    

    container.appendChild(mainInfo);

    // ----- DELETE BUTTON -----
    const deleteBtn = renderDeleteButton(task, taskDiv, 20);
    deleteBtn.style.position = "absolute";
    deleteBtn.style.top = "4px";
    deleteBtn.style.right = "8px";
    deleteBtn.style.padding = "0px";

    // ----- RIGHT COLUMN: NOTES + PRIORITY -----
    if (task.notes || task.priority) {
        const rightColumn = document.createElement("div");
        rightColumn.style.display = "flex";
        rightColumn.style.flexDirection = "column";
        rightColumn.style.flex = "1";
        rightColumn.style.gap = "8px";
        rightColumn.style.marginRight = "32px";

        if (task.notes) {
            const notesBox = document.createElement("div");
            notesBox.style.fontSize = "medium";

            if (checkOverdue(task.dueDate, new Date()) && task.status === "open") {
                notesBox.style.backgroundColor = "#fde4df"; // red for overdue
                notesBox.style.border = "1px solid #f98369";
            } else {
                notesBox.style.backgroundColor = (task.status === "open") ? "#fffdf6" : "#dedcd6";
                notesBox.style.border = "1px solid #ccc";
            }
            notesBox.style.padding = "8px";
            notesBox.style.borderRadius = "8px";
            notesBox.textContent = task.notes;
            rightColumn.appendChild(notesBox);
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
    }

        // ----- FINAL TASK DIV -----
        taskDiv.style.position = "relative";
        taskDiv.appendChild(container);
}


  

function renderTasks(tasks = tasklist) {
    const container = document.getElementById("output");

    if (tasks.length === 0) {
        container.innerHTML = "No tasks found.";
        return;
    }

    container.innerHTML = ""; // clear old output

    const currentDatetime = new Date(); // get current date and time to check for due tasks

    tasks.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task-card"; // optional for styling
      taskDiv.style.padding = "8px";
      taskDiv.style.marginBottom = "8px";

      if (checkOverdue(task.dueDate, currentDatetime) && task.status === "open") {
        taskDiv.style.backgroundColor = "#fed4d6"; // red for overdue
        taskDiv.style.border = "2px solid #d6040b";
      } else {
        taskDiv.style.backgroundColor = (task.status === "closed") ? "#e5e0cb" : "#fff8df";
        taskDiv.style.border = "1px solid #000";
      }
      
      renderTask(task, taskDiv); // Display Task Details
  
      container.appendChild(taskDiv);
    });
}

function renderDefaultTagFilters() {
    const defaultTagFilters = document.getElementById("tagFilters");
    defaultTagFilters.innerHTML = ""; // Clear existing options
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

function renderTagFilters() {

    renderDefaultTagFilters();


    const tagFilterOptions = document.getElementById("customTagFilters");
    tagFilterOptions.innerHTML = ""; // Clear existing options
    customTags.forEach(tag => {
        const tagOption = document.createElement("div");
        tagOption.style.display = "inline-flex";
        tagOption.style.marginRight = "8px";
        tagOption.style.alignItems = "center";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        
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

        tagFilterOptions.appendChild(tagOption);
    });
    return customTags;
}
  

function updateStatus(dateCreated, newStatus) {
    const newTasks = tasklist.map(task => {
        if (task.dateCreated === dateCreated) {
            return { ...task, status: newStatus };
        }
        return task;
    }
    );
    tasklist = newTasks; // Update the tasklist with the new array
    applyFiltersAndSort(); // Reapply filters and sorting
    saveTasks(); // Save the updated tasklist to local storage
    return newTasks;
}
    
function filterByStatus(tasks = tasklist, status = currentStatusFilter) {
    return [...tasks].filter(task => task.status === status);
}

// Filter tasks by selected tags. only returns tasks that have all the selected tags
function filterByTags(tasks = tasklist, tagFilters = currentTagFilters) {
    if (tagFilters.length === 0) return tasks; // No tags selected, return all tasks
    return [...tasks].filter(task => tagFilters.every(tag => task.tags.includes(tag)));
}



function sortTasks(criteria, tasks = tasklist) {

    const priorityOrder = {"": 0, "low": 1, "medium": 2, "high": 3};
    
    const sortedTasks = [...tasks].sort((a, b) => {
        if (criteria === "dueDate") {
            //if the date is empty, we want to put it at the end of the list
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (criteria === "priority") {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (criteria === "title") {
            return a.title.localeCompare(b.title);
        } else {
            return b.dateCreated - a.dateCreated; // default to dateCreated
        }
    });

    return sortedTasks;
}

function applyFiltersAndSort() {
    let filtered = (currentStatusFilter === "open" || currentStatusFilter === "closed") ? filterByStatus(tasklist, currentStatusFilter) : tasklist;
    filtered = filterByTags(filtered, currentTagFilters);
    let sorted = sortTasks(currentSort, filtered);
    renderTasks(sorted);
    return sorted;
}
  

function countTags() {
    return tasklist.reduce((counts, task) => {
        task.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
        return counts; 
    }, {});
}

function deleteTask(dateCreated) {
    // I allow for multiple tasks with the same Title, so I use dateCreated to identify the task
    const newTasks = tasklist.filter(task => task.dateCreated !== dateCreated);
    tasklist = newTasks; 
    applyFiltersAndSort(); // Reapply filters and sorting
    saveTasks(); 
    return newTasks;
}

function deleteTag(tag) {
    customTags = customTags.filter(t => t !== tag);
    saveTags();
    renderCustomTags();
    return customTags;
}

function clearTasks() {
    tasklist = [];
    currentStatusFilter = "";
    currentTagFilters = [];
    currentSort = "newest";
    document.getElementById("filter").value = "";
    document.getElementById("tagFilters").innerHTML = ""; // Clear tag filters
    document.getElementById("sortOrder").value = "";
    renderTasks();
    saveTasks();
    return tasklist;
}



// DOM handlers // 
window.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadTags();
    applyFiltersAndSort(); // or renderTasks()
    renderCustomTags();
});

//handles the form submission
document.getElementById("addTaskForm").addEventListener("submit", (e) => {
    
    e.preventDefault();

    const title = document.getElementById("title").value;
    if (title.length > 48) { //if the title is too long, it messses up the layout
        title = title.substring(0, 48) + "...";
    }


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
        tagInput.value = ""; // Clear the input field
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
  