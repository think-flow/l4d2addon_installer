<template>
    <div class="left-column">
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
            <li>Item 4</li>
            <li>Item 5</li>
        </ul>
    </div>
</template>

<style>
.left-column {
    width: 25%;
    padding: 10px;
    background-color: #f0f0f0;
    box-sizing: border-box;
    border-right: 1px solid #ccc;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    padding: 10px;
    border-bottom: 1px solid #ccc;
}

li:hover {
    background-color: #e0e0e0;
    cursor: pointer;
}
</style>