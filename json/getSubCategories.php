<?php
/**
 * Created by PhpStorm.
 * User: nextlevelshit
 * Date: 23.05.15
 * Time: 14:13
 */

error_reporting(0);

$category = str_replace(" ", "%20", $_GET['category']);

$lang = ($_GET['lang']) ? $_GET['lang'] : substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);

if (isset($category)) {

//    $url = "Category:$category.json";
//    $url = "http://$lang.wikipedia.org/w/api.php?action=query&list=categorymembers&cmnamespace=14&cmlimit=100&cmtitle=Category%3A$category&format=json";
//    $url = "https://$lang.wikipedia.org/w/api.php?action=query&list=categorymembers&format=json&cmtitle=Category%3A$category&cmprop=ids|title|type&cmnamespace=14&cmtype=subcat&cmlimit=5";
    $url = "https://$lang.wikipedia.org/w/api.php?action=query&list=categorymembers&format=json&cmtitle=Category%3A$category&cmprop=ids%7Ctitle%7Ctype&cmnamespace=0%7C14&cmtype=subcat%7Cpage&cmlimit=12";

    $f = fopen($url, 'r');
    $html = '';

    while (!feof($f)) {
        $html .= fread($f, 240000);
    }

    // Decode to wikipedia output to readable array

    $json = json_decode($html, true);

    // Grep the necessary part of the wikipedia input

    $categoriesWiki = $json['query']['categorymembers'];

    // Iterate through all inputs from wikipedia
    // and output only the id and formatted title

    $categoriesOutput = array();

    foreach ($categoriesWiki as $key => $item) {
        $newItem = array();
        $newItem['id'] = $item['pageid'];
        $newItem['type'] = $item['type'];
        $newItem['title'] = preg_replace("(.*:)","",$item['title']);
        $categoriesOutput[] = $newItem;
    }

    // Close file reading

    fclose($f);

    // Output as readable json

    echo(json_encode($categoriesOutput));
}