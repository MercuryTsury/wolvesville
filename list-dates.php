<?php
header('Content-Type: application/json');
$dir = './data/clan/';
$dates = [];

if (is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                $dates[] = pathinfo($file, PATHINFO_FILENAME);
            }
        }
        closedir($dh);
    }
}
// Trier par date décroissante (les plus récents en premier)
rsort($dates);
echo json_encode($dates);
?>
