document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const taskDateTime = document.getElementById('taskDateTime');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const allTasksBtn = document.getElementById('allTasks');
    const activeTasksBtn = document.getElementById('activeTasks');
    const completedTasksBtn = document.getElementById('completedTasks');
    
    // Initialize tasks array from localStorage or empty array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Initialize the app
    function init() {
        renderTasks();
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add task
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Filter buttons
        allTasksBtn.addEventListener('click', () => filterTasks('all'));
        activeTasksBtn.addEventListener('click', () => filterTasks('active'));
        completedTasksBtn.addEventListener('click', () => filterTasks('completed'));
    }
    
    // Add a new task
    function addTask() {
        const taskText = taskInput.value.trim();
        const taskDate = taskDateTime.value;
        
        if (taskText === '') {
            alert('Please enter a task');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            dateTime: taskDate || null,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        // Reset input fields
        taskInput.value = '';
        taskDateTime.value = '';
        taskInput.focus();
    }
    
    // Render tasks based on current filter
    function renderTasks(filter = 'all') {
        taskList.innerHTML = '';
        
        let filteredTasks = [];
        
        switch(filter) {
            case 'active':
                filteredTasks = tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(task => task.completed);
                break;
            default:
                filteredTasks = [...tasks];
        }
        
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = filter === 'all' ? 'No tasks yet!' : 
                                      filter === 'active' ? 'No active tasks!' : 'No completed tasks!';
            emptyMessage.classList.add('empty-message');
            taskList.appendChild(emptyMessage);
            return;
        }
        
        // Sort tasks: incomplete first, then by date (if available), then by creation time
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            if (a.dateTime && b.dateTime) {
                return new Date(a.dateTime) - new Date(b.dateTime);
            }
            
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            // Format date and time if available
            let dateTimeText = '';
            if (task.dateTime) {
                const date = new Date(task.dateTime);
                dateTimeText = date.toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="task-datetime">${dateTimeText}</span>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
                <input type="text" class="task-edit-input" value="${task.text}">
                <input type="datetime-local" class="task-edit-datetime" value="${task.dateTime || ''}">
            `;
            
            taskList.appendChild(taskItem);
            
            // Add event listeners to the new task
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            const editInput = taskItem.querySelector('.task-edit-input');
            const editDateTime = taskItem.querySelector('.task-edit-datetime');
            const taskText = taskItem.querySelector('.task-text');
            
            checkbox.addEventListener('change', function() {
                toggleTaskComplete(task.id, this.checked);
            });
            
            deleteBtn.addEventListener('click', function() {
                deleteTask(task.id);
            });
            
            editBtn.addEventListener('click', function() {
                taskItem.classList.add('edit-mode');
                editInput.focus();
            });
            
            editInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    updateTask(task.id, editInput.value.trim(), editDateTime.value);
                }
            });
            
            editInput.addEventListener('blur', function() {
                updateTask(task.id, editInput.value.trim(), editDateTime.value);
            });
            
            editDateTime.addEventListener('change', function() {
                updateTask(task.id, editInput.value.trim(), editDateTime.value);
            });
        });
    }
    
    // Toggle task completion status
    function toggleTaskComplete(id, completed) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = completed;
            saveTasks();
            renderTasks(getCurrentFilter());
        }
    }
    
    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks(getCurrentFilter());
    }
    
    // Update task text and/or datetime
    function updateTask(id, newText, newDateTime) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
            if (newText === '') {
                deleteTask(id);
                return;
            }
            
            tasks[taskIndex].text = newText;
            tasks[taskIndex].dateTime = newDateTime || null;
            saveTasks();
            
            const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskItem) {
                taskItem.classList.remove('edit-mode');
                renderTasks(getCurrentFilter());
            }
        }
    }
    
    // Filter tasks
    function filterTasks(filter) {
        // Update active filter button
        allTasksBtn.classList.remove('active');
        activeTasksBtn.classList.remove('active');
        completedTasksBtn.classList.remove('active');
        
        switch(filter) {
            case 'all':
                allTasksBtn.classList.add('active');
                break;
            case 'active':
                activeTasksBtn.classList.add('active');
                break;
            case 'completed':
                completedTasksBtn.classList.add('active');
                break;
        }
        
        renderTasks(filter);
    }
    
    // Get current filter
    function getCurrentFilter() {
        if (allTasksBtn.classList.contains('active')) return 'all';
        if (activeTasksBtn.classList.contains('active')) return 'active';
        return 'completed';
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize the app
    init();
});
